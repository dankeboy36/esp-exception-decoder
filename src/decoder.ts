import debug from 'debug';
import { FQBN } from 'fqbn';
import path from 'node:path';
import type {
  ArduinoState,
  BoardDetails,
  BuildProperties,
} from 'vscode-arduino-api';
import { decodeRiscv, InvalidTargetError } from './riscv';
import { access, Debug, isWindows, neverSignal, run } from './utils';

const decoderDebug: Debug = debug('espExceptionDecoder:decoder');

export interface DecodeParams {
  readonly toolPath: string;
  readonly elfPath: string;
  readonly fqbn: FQBN;
  readonly sketchPath: string; // UI
}

type Fallback<T> = {
  [P in keyof T]: () => Promise<T[P] | undefined>;
};

type DecodeFallbackParams = Fallback<Pick<DecodeParams, 'elfPath'>>;

export async function createDecodeParams(
  arduinoState: ArduinoState,
  fallbackParams?: DecodeFallbackParams
): Promise<DecodeParams> {
  const { boardDetails, compileSummary, sketchPath } = arduinoState;
  if (!sketchPath) {
    throw new Error('Sketch path is not set');
  }
  if (!arduinoState.fqbn) {
    throw new Error('No board selected');
  }
  const fqbn = new FQBN(arduinoState.fqbn).sanitize();
  const { vendor, arch } = fqbn;
  if (!boardDetails) {
    throw new DecodeParamsError(
      `Platform '${vendor}:${arch}' is not installed`,
      { sketchPath, fqbn }
    );
  }
  if (!supportedArchitectures.has(fqbn.arch)) {
    throw new DecodeParamsError(`Unsupported board: '${fqbn}'`, {
      sketchPath,
      fqbn,
    });
  }
  if (!compileSummary) {
    throw new DecodeParamsError(
      'The summary of the previous compilation is unavailable. Compile the sketch',
      {
        sketchPath,
        fqbn,
      }
    );
  }
  const { buildPath } = compileSummary;
  const sketchFolderName = path.basename(sketchPath);
  const [toolPath, elfPath = await fallbackParams?.elfPath()] =
    await Promise.all([
      findToolPath(boardDetails),
      findElfPath(sketchFolderName, buildPath),
    ]);
  if (!elfPath) {
    throw new DecodeParamsError(
      `Could not detect the '.elf' file in the build folder`,
      { sketchPath, fqbn }
    );
  }
  if (!toolPath) {
    throw new DecodeParamsError('Could not detect the GDB tool path', {
      sketchPath,
      fqbn,
    });
  }
  return {
    toolPath,
    elfPath,
    fqbn,
    sketchPath,
  };
}

export class DecodeParamsError extends Error {
  constructor(
    message: string,
    private readonly partial: Pick<DecodeParams, 'fqbn' | 'sketchPath'>
  ) {
    super(message);
    Object.setPrototypeOf(this, DecodeParamsError.prototype);
  }

  get fqbn(): string {
    return this.partial.fqbn.toString();
  }

  get sketchPath(): string {
    return this.partial.sketchPath;
  }
}

export interface DecodeOptions {
  readonly signal?: AbortSignal;
  readonly debug?: Debug;
}
export const defaultDecodeOptions = {
  signal: neverSignal,
  debug: decoderDebug,
} as const;

export interface GDBLine {
  address: string;
  line: string;
}
export function isGDBLine(arg: unknown): arg is GDBLine {
  return (
    typeof arg === 'object' &&
    (<GDBLine>arg).address !== undefined &&
    typeof (<GDBLine>arg).address === 'string' &&
    (<GDBLine>arg).line !== undefined &&
    typeof (<GDBLine>arg).line === 'string'
  );
}

export interface ParsedGDBLine extends GDBLine {
  file: string;
  method: string;
  args?: Readonly<Record<string, string>>; // TODO: ask community if useful
}
export function isParsedGDBLine(gdbLine: GDBLine): gdbLine is ParsedGDBLine {
  return (
    (<ParsedGDBLine>gdbLine).file !== undefined &&
    typeof (<ParsedGDBLine>gdbLine).file === 'string' &&
    (<ParsedGDBLine>gdbLine).method !== undefined &&
    typeof (<ParsedGDBLine>gdbLine).method === 'string'
  );
}

/**
 * Register address in the `0x` format. For example, `'0x4020104e'`.
 */
export type Address = string;
/**
 * Successfully decoded register address, or the address.
 */
export type Location = GDBLine | ParsedGDBLine | Address;

export interface DecodeResult {
  readonly exception: [message: string, code: number] | undefined;
  readonly registerLocations: Record<string, Location>;
  readonly stacktraceLines: (GDBLine | ParsedGDBLine)[];
  readonly allocLocation: [location: Location, size: number] | undefined;
}

export async function decode(
  params: DecodeParams,
  input: string,
  options: DecodeOptions = defaultDecodeOptions
): Promise<DecodeResult> {
  let result: DecodeResult | undefined;
  try {
    result = await decodeRiscv(params, input, options);
  } catch (err) {
    if (err instanceof InvalidTargetError) {
      // try ESP32/ESP8266
    } else {
      throw err;
    }
  }

  if (!result) {
    const [exception, registerLocations, stacktraceLines, allocLocation] =
      await Promise.all([
        parseException(input),
        decodeRegisters(params, input, options),
        decodeStacktrace(params, input, options),
        decodeAlloc(params, input, options),
      ]);

    result = {
      exception,
      registerLocations,
      stacktraceLines,
      allocLocation,
    };
  }

  return fixWindowsPaths(result);
}

function fixWindowsPaths(result: DecodeResult): DecodeResult {
  const [location] = result.allocLocation ?? [];
  if (location && isGDBLine(location) && isParsedGDBLine(location)) {
    location.file = fixWindowsPath(location.file);
  }
  return {
    ...result,
    stacktraceLines: result.stacktraceLines.map((gdbLine) =>
      isParsedGDBLine(gdbLine)
        ? { ...gdbLine, file: fixWindowsPath(gdbLine.file) }
        : gdbLine
    ),
    registerLocations: Object.fromEntries(
      Object.entries(result.registerLocations).map(([key, value]) => [
        key,
        isGDBLine(value) && isParsedGDBLine(value)
          ? { ...value, file: fixWindowsPath(value.file) }
          : value,
      ])
    ),
  };
}

// To fix the path separator issue on Windows:
//      -      "file": "D:\\a\\esp-exception-decoder\\esp-exception-decoder\\src\\test\\sketches\\riscv_1/riscv_1.ino"
//      +      "file": "d:\\a\\esp-exception-decoder\\esp-exception-decoder\\src\\test\\sketches\\riscv_1\\riscv_1.ino"
function fixWindowsPath(
  path: string,
  isWindows = process.platform === 'win32'
): string {
  return isWindows && /^[a-zA-Z]:\\/.test(path)
    ? path.replace(/\//g, '\\')
    : path;
}

// Taken from https://github.com/me-no-dev/EspExceptionDecoder/blob/ff4fc36bdaf0bfd6e750086ac01554867ede76d3/src/EspExceptionDecoder.java#L59-L90
const reserved = 'reserved';
const exceptions = [
  'Illegal instruction',
  'SYSCALL instruction',
  'InstructionFetchError: Processor internal physical address or data error during instruction fetch',
  'LoadStoreError: Processor internal physical address or data error during load or store',
  'Level1Interrupt: Level-1 interrupt as indicated by set level-1 bits in the INTERRUPT register',
  "Alloca: MOVSP instruction, if caller's registers are not in the register file",
  'IntegerDivideByZero: QUOS, QUOU, REMS, or REMU divisor operand is zero',
  reserved,
  'Privileged: Attempt to execute a privileged operation when CRING ? 0',
  'LoadStoreAlignmentCause: Load or store to an unaligned address',
  reserved,
  reserved,
  'InstrPIFDataError: PIF data error during instruction fetch',
  'LoadStorePIFDataError: Synchronous PIF data error during LoadStore access',
  'InstrPIFAddrError: PIF address error during instruction fetch',
  'LoadStorePIFAddrError: Synchronous PIF address error during LoadStore access',
  'InstTLBMiss: Error during Instruction TLB refill',
  'InstTLBMultiHit: Multiple instruction TLB entries matched',
  'InstFetchPrivilege: An instruction fetch referenced a virtual address at a ring level less than CRING',
  reserved,
  'InstFetchProhibited: An instruction fetch referenced a page mapped with an attribute that does not permit instruction fetch',
  reserved,
  reserved,
  reserved,
  'LoadStoreTLBMiss: Error during TLB refill for a load or store',
  'LoadStoreTLBMultiHit: Multiple TLB entries matched for a load or store',
  'LoadStorePrivilege: A load or store referenced a virtual address at a ring level less than CRING',
  reserved,
  'LoadProhibited: A load referenced a page mapped with an attribute that does not permit loads',
  'StoreProhibited: A store referenced a page mapped with an attribute that does not permit stores',
];

function parseException(
  input: string
): [message: string, code: number] | undefined {
  const matches = input.matchAll(/Exception \(([0-9]*)\)/g);
  for (const match of matches) {
    const value = match[1];
    if (value) {
      const code = Number.parseInt(value.trim(), 10);
      const exception = exceptions[code];
      if (exception) {
        return [exception, code];
      }
    }
  }
  return undefined;
}

async function decodeRegisters(
  params: DecodeParams,
  input: string,
  options: DecodeOptions
): Promise<Record<string, GDBLine | Address>> {
  const [pc, excvaddr] = parseRegisters(input);
  const decode = async (address: string | undefined) => {
    if (address) {
      const lines = await decodeFunctionAtAddress(params, [address], options);
      const line = lines.shift();
      return line ?? `0x${address}`;
    }
    return undefined;
  };
  const [pcLine, excvaddrLine] = await Promise.all([
    decode(pc),
    decode(excvaddr),
  ]);
  const lines = <Record<string, GDBLine | string>>{};
  if (pcLine) {
    lines['PC'] = pcLine;
  }
  if (excvaddrLine) {
    lines['EXCVADDR'] = excvaddrLine;
  }
  return lines;
}

function parseRegisters(
  input: string
): [pc: string | undefined, excvaddr: string | undefined] {
  // ESP32 register format first, then the ESP8266 one
  const pc =
    parseRegister('PC\\s*:\\s*(0x)?', input) ?? parseRegister('epc1=0x', input);
  const excvaddr =
    parseRegister('EXCVADDR\\s*:\\s*(0x)?', input) ??
    parseRegister('excvaddr=0x', input);
  return [pc, excvaddr];
}

function parseRegister(regexPrefix: string, input: string): string | undefined {
  const matches = input.matchAll(
    new RegExp(`${regexPrefix}([0-9a-f]{8})`, 'gmi')
  );
  for (const match of matches) {
    const value = match.find((m) => m.length === 8); // find the register address
    if (value) {
      return value;
    }
  }
  return undefined;
}

async function decodeAlloc(
  params: DecodeParams,
  input: string,
  options: DecodeOptions = defaultDecodeOptions
): Promise<[location: Location, size: number] | undefined> {
  const result = parseAlloc(input);
  if (!result) {
    return undefined;
  }
  const [address, size] = result;
  const lines = await decodeFunctionAtAddress(params, [address], options);
  const line = lines.shift();
  return line ? [line, size] : [`0x${address}`, size];
}

function parseAlloc(
  input: string
): [address: string, size: number] | undefined {
  const matches = input.matchAll(
    /last failed alloc call: (4[0-3][0-9a-f]{6})\((\d+)\)/gim
  );
  for (const match of matches) {
    const [, address, rawSize] = match;
    const size = Number.parseInt(rawSize, 10);
    if (!Number.isNaN(size) && address) {
      return [address, size];
    }
  }
  return undefined;
}

async function decodeStacktrace(
  params: DecodeParams,
  input: string,
  options: DecodeOptions
): Promise<GDBLine[]> {
  const content = parseStacktrace(input);
  if (!content) {
    throw new Error('Could not recognize stack trace/backtrace');
  }
  const addresses = parseInstructionAddresses(content);
  if (!addresses.length) {
    throw new Error(
      'Could not detect any instruction addresses in the stack trace/backtrace'
    );
  }
  return decodeFunctionAtAddress(params, addresses, options);
}

async function decodeFunctionAtAddress(
  params: DecodeParams,
  addresses: string[],
  options: DecodeOptions = defaultDecodeOptions
): Promise<GDBLine[]> {
  const { toolPath, elfPath } = params;
  const flags = buildCommandFlags(addresses, elfPath);
  const stdout = await run(toolPath, flags, options);
  return parseGDBOutput(stdout, options.debug);
}

function parseStacktrace(input: string): string | undefined {
  return stripESP32Content(input) ?? stripESP8266Content(input);
}

function stripESP8266Content(input: string): string | undefined {
  const startDelimiter = '>>>stack>>>';
  const startIndex = input.indexOf(startDelimiter);
  if (startIndex < 0) {
    return undefined;
  }
  const endDelimiter = '<<<stack<<<';
  const endIndex = input.indexOf(endDelimiter);
  if (endIndex < 0) {
    return undefined;
  }
  return input.substring(startIndex + startDelimiter.length, endIndex);
}

function stripESP32Content(input: string): string | undefined {
  const matches = input.matchAll(/Backtrace:(.*)/g);
  for (const match of matches) {
    const content = match[1];
    if (content) {
      return content;
    }
  }
  return undefined;
}

function parseInstructionAddresses(content: string): string[] {
  return Array.from(content.matchAll(/4[0-3][0-9a-f]{6}\b/gim))
    .map((match) => match[0])
    .filter(Boolean);
}

function buildCommandFlags(addresses: string[], elfPath: string): string[] {
  if (!addresses.length) {
    throw new Error('Invalid argument: addresses.length <= 0');
  }
  return [
    '--batch', // executes in batch mode (https://sourceware.org/gdb/onlinedocs/gdb/Mode-Options.html)
    elfPath,
    '-ex', // executes a command
    'set listsize 1', // set the default printed source lines to one (https://sourceware.org/gdb/onlinedocs/gdb/List.html)
    ...addresses
      .map((address) => ['-ex', `list *0x${address}`]) // lists the source at address (https://sourceware.org/gdb/onlinedocs/gdb/Address-Locations.html#Address-Locations)
      .reduce((acc, curr) => acc.concat(curr)),
    '-ex',
    'q', // quit
  ];
}

const esp32 = 'esp32';
const esp8266 = 'esp8266';
const supportedArchitectures = new Set([esp32, esp8266]);

const defaultTarch = 'xtensa';
const defaultTarget = 'lx106';

const buildTarch = 'build.tarch';
const buildTarget = 'build.target';

async function findToolPath(
  boardDetails: BoardDetails,
  debug: Debug = decoderDebug
): Promise<string | undefined> {
  const { fqbn, buildProperties } = boardDetails;
  const { arch } = new FQBN(fqbn);
  if (!supportedArchitectures.has(arch)) {
    throw new Error(`Unsupported board architecture: '${fqbn}'`);
  }
  debug(`fqbn: ${fqbn}`);
  let tarch = defaultTarch;
  let target = defaultTarget;
  if (arch === esp32) {
    let buildPropTarch = buildProperties[buildTarch];
    if (!buildPropTarch) {
      debug(
        `could not find ${buildTarch} value. defaulting to ${defaultTarch}`
      );
      buildPropTarch = defaultTarch;
    }
    tarch = getValue(
      {
        buildProperties,
        key: buildTarch,
      },
      defaultTarch
    );
    target = getValue(
      {
        buildProperties,
        key: buildTarget,
      },
      defaultTarget
    );
  }
  debug(`tarch: ${tarch}`);
  debug(`target: ${target}`);

  const toolchain = `${tarch}-${target}-elf`;
  debug(`toolchain: ${toolchain}`);
  const gdbTool = `${tarch}-esp-elf-gdb`;
  debug(`gdbTool: ${gdbTool}`);
  const gdb = `${toolchain}-gdb${isWindows ? '.exe' : ''}`;
  debug(`gdb: ${gdb}`);

  const find = async (key: string): Promise<string | undefined> => {
    const value = getValue({
      buildProperties,
      key,
      debug,
    });
    debug(`${key}: ${value}`);
    if (!value) {
      return undefined;
    }
    const toolPath = path.join(value, 'bin', gdb);
    if (await access(toolPath)) {
      debug(`[${key}] gdb found at: ${toolPath}`);
      return toolPath;
    }
    debug(`[${key}] gdb not found at: ${toolPath}`);
  };

  // `runtime.tools.*` won't work for ESP32 installed from Git. See https://github.com/arduino/arduino-cli/issues/2197#issuecomment-1572921357.
  // `runtime.tools.*` ESP8266 requires this. Hence, the fallback here.
  const gdbToolPath = `tools.${gdbTool}.path`;
  const toolChainGCCPath = `tools.${toolchain}-gcc.path`;
  return (
    (await find(`runtime.${gdbToolPath}`)) ??
    (await find(`runtime.${toolChainGCCPath}`)) ??
    (await find(gdbToolPath)) ??
    (await find(toolChainGCCPath))
  );
}

interface GetValueParams {
  readonly buildProperties: BuildProperties;
  readonly key: string;
  readonly debug?: Debug;
}

function getValue(params: GetValueParams): string | undefined;
function getValue(params: GetValueParams, defaultValue: string): string;
function getValue(
  params: GetValueParams,
  defaultValue?: string | undefined
): string | undefined {
  const { buildProperties, key, debug } = params;
  let value: string | undefined = buildProperties[key];
  if (value === undefined) {
    debug?.(
      `could not find ${key} value.${
        defaultValue ? `defaulting to ${defaultValue}` : ''
      }`
    );
    value = defaultValue;
  }
  return value;
}

async function findElfPath(
  sketchFolderName: string,
  buildPath: string
): Promise<string | undefined> {
  const [inoElfPath, cppElfPath] = await Promise.all(
    ['ino', 'cpp'].map((ext) =>
      access(path.join(buildPath, `${sketchFolderName}.${ext}.elf`))
    )
  );
  return inoElfPath ?? cppElfPath ?? undefined;
}

function parseGDBOutput(
  stdout: string,
  debug: Debug = decoderDebug
): GDBLine[] {
  const lines = stdout.split(/\r?\n/).map((line) => parseGDBLine(line, debug));
  return lines.filter(isGDBLine);
}

function parseGDBLine(
  raw: string,
  debug: Debug = decoderDebug
): GDBLine | undefined {
  const matches = raw.matchAll(
    // TODO: restrict to instruction addresses? `4[0-3][0-9a-f]{6}`
    /^(0x[0-9a-f]{8})\s+is in\s+(\S+)\s+\((.*):(\d+)\)\.$/gi
  );
  for (const match of matches) {
    const [, address, method, file, line] = match;
    if (address && method && file && line) {
      const gdbLine: ParsedGDBLine = {
        address,
        method,
        file,
        line,
      };
      debug(`parseGDBLine, OK: ${JSON.stringify(gdbLine)}`);
      return gdbLine;
    }
  }
  const fallbackMatches = raw.matchAll(/(0x[0-9a-f]{8})(\s+is in\s+.*)/gi);
  for (const match of fallbackMatches) {
    const [, address, line] = match;
    if (address && line) {
      const gdbLine = {
        address,
        line,
      };
      debug(`parseGDBLine, fallback: ${JSON.stringify(gdbLine)}`);
      return gdbLine;
    }
  }
  debug(`parseGDBLine, failed: ${raw}`);
  return undefined;
}

/**
 * (non-API)
 */
export const __tests = {
  buildCommandFlags,
  findToolPath,
  findElfPath,
  parseStacktrace,
  parseInstructionAddresses,
  parseGDBOutput,
  parseException,
  parseAlloc,
  parseRegisters,
  exceptions,
  fixWindowsPath,
  fixWindowsPaths,
} as const;
