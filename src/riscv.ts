import debug from 'debug';
import { FQBN } from 'fqbn';
import net from 'node:net';
import {
  GDBLine,
  type DecodeOptions,
  type DecodeParams,
  type DecodeResult,
  type ParsedGDBLine,
} from './decoder';
import { Debug, run } from './utils';

const riscvDebug: Debug = debug('espExceptionDecoder:riscv');

// Based on the work of:
//  - [Peter Dragun](https://github.com/peterdragun)
//  - [Ivan Grokhotkov](https://github.com/igrr)
//  - [suda-morris](https://github.com/suda-morris)
//
// https://github.com/espressif/esp-idf-monitor/blob/fae383ecf281655abaa5e65433f671e274316d10/esp_idf_monitor/gdb_panic_server.py

const gdbRegsInfoRiscvIlp32 = [
  'X0',
  'RA',
  'SP',
  'GP',
  'TP',
  'T0',
  'T1',
  'T2',
  'S0/FP',
  'S1',
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
  'S10',
  'S11',
  'T3',
  'T4',
  'T5',
  'T6',
  'MEPC', // PC equivalent
] as const;

type Target = keyof typeof gdbRegsInfo;

const gdbRegsInfo = {
  esp32c2: gdbRegsInfoRiscvIlp32,
  esp32c3: gdbRegsInfoRiscvIlp32,
  esp32c6: gdbRegsInfoRiscvIlp32,
  esp32h2: gdbRegsInfoRiscvIlp32,
  esp32h4: gdbRegsInfoRiscvIlp32,
} as const;

function isTarget(arg: unknown): arg is Target {
  return typeof arg === 'string' && arg in gdbRegsInfo;
}

function createRegNameValidator<T extends Target>(type: T) {
  const regsInfo = gdbRegsInfo[type];
  if (!regsInfo) {
    throw new Error(`Unsupported target: ${type}`);
  }
  return (regName: string): regName is (typeof regsInfo)[number] =>
    regsInfo.includes(regName as (typeof regsInfo)[number]);
}

interface RegisterDump {
  coreId: number;
  regs: Record<string, number>;
}

interface StackDump {
  baseAddr: number;
  data: number[];
}

interface ParsePanicOutputParams {
  input: string;
  target: Target;
}

interface ParsePanicOutputResult {
  exception?: number;
  MTVAL: number | undefined;
  regDumps: RegisterDump[];
  stackDump: StackDump[];
}

function parse({
  input,
  target,
}: ParsePanicOutputParams): ParsePanicOutputResult {
  const lines = input.split(/\r?\n|\r/);
  const regDumps: RegisterDump[] = [];
  const stackDump: StackDump[] = [];
  let currentRegDump: RegisterDump | undefined;
  let inStackMemory = false;
  let exception: number | undefined;
  let MTVAL: number | undefined;

  const regNameValidator = createRegNameValidator(target);

  lines.forEach((line) => {
    if (line.startsWith('Core')) {
      const match = line.match(/^Core\s+(\d+)\s+register dump:/);
      if (match) {
        currentRegDump = {
          coreId: parseInt(match[1], 10),
          regs: {},
        };
        regDumps.push(currentRegDump);
      }
    } else if (currentRegDump && !inStackMemory) {
      const regMatches = line.matchAll(/([A-Z_0-9/]+)\s*:\s*(0x[0-9a-fA-F]+)/g);
      for (const match of regMatches) {
        const regName = match[1];
        const regAddress = parseInt(match[2], 16);
        if (regNameValidator(regName)) {
          currentRegDump.regs[regName] = regAddress;
        } else if (regName === 'MCAUSE') {
          exception = regAddress; // it's an exception code
        } else if (regName === 'MTVAL') {
          MTVAL = regAddress; // EXCVADDR equivalent
        }
      }
      if (line.trim() === 'Stack memory:') {
        inStackMemory = true;
      }
    } else if (inStackMemory) {
      const match = line.match(/^([0-9a-fA-F]+):\s*((?:0x[0-9a-fA-F]+\s*)+)/);
      if (match) {
        const baseAddr = parseInt(match[1], 16);
        const data = match[2]
          .trim()
          .split(/\s+/)
          .map((hex) => parseInt(hex, 16));
        stackDump.push({ baseAddr, data });
      }
    }
  });

  return { regDumps, stackDump, exception, MTVAL };
}

interface GetStackAddrAndDataParams {
  stackDump: readonly StackDump[];
}

interface GetStackAddrAndDataResult {
  stackBaseAddr: number;
  stackData: Buffer;
}

function getStackAddrAndData({
  stackDump,
}: GetStackAddrAndDataParams): GetStackAddrAndDataResult {
  let stackBaseAddr = 0;
  let baseAddr = 0;
  let bytesInLine = 0;
  let stackData = Buffer.alloc(0);

  stackDump.forEach((line) => {
    const prevBaseAddr = baseAddr;
    baseAddr = line.baseAddr;
    if (stackBaseAddr === 0) {
      stackBaseAddr = baseAddr;
    } else {
      if (baseAddr !== prevBaseAddr + bytesInLine) {
        throw new Error('Invalid base address');
      }
    }

    const lineData = Buffer.concat(
      line.data.map((word) =>
        Buffer.from(word.toString(16).padStart(8, '0'), 'hex')
      )
    );
    bytesInLine = lineData.length;
    stackData = Buffer.concat([stackData, lineData]);
  });

  return { stackBaseAddr, stackData };
}

interface PanicInfo {
  MTVAL?: number;
  exception?: number;
  coreId: number;
  regs: Record<string, number>;
  stackBaseAddr: number;
  stackData: Buffer;
  target: Target;
}

interface ParseIdfRiscvPanicOutputParams {
  input: string;
  target: Target;
}

function parsePanicOutput({
  input,
  target,
}: ParseIdfRiscvPanicOutputParams): PanicInfo {
  const { regDumps, stackDump, MTVAL, exception } = parse({
    input,
    target,
  });

  if (regDumps.length > 1) {
    throw new Error('Handling of multi-core register dumps not implemented');
  }

  const { coreId, regs } = regDumps[0];
  const { stackBaseAddr, stackData } = getStackAddrAndData({ stackDump });

  return {
    MTVAL,
    exception,
    coreId,
    regs,
    stackBaseAddr,
    stackData,
    target,
  };
}

interface GdbServerParams {
  panicInfo: PanicInfo;
  debug?: Debug;
}

class GdbServer {
  private readonly panicInfo: PanicInfo;
  private readonly regList: readonly string[];
  private readonly debug: Debug;
  private server?: net.Server;

  constructor(params: GdbServerParams) {
    this.panicInfo = params.panicInfo;
    this.regList = gdbRegsInfo[params.panicInfo.target];
    this.debug = params.debug ?? riscvDebug;
  }

  async start(port = 0) {
    if (this.server) {
      throw new Error('Server already started');
    }
    const server = net.createServer();
    this.server = server;
    await new Promise<void>((resolve) => {
      server.on('listening', resolve);
      server.listen(port);
    });
    const address = server.address();
    if (!address) {
      throw new Error('Failed to start server');
    }
    if (typeof address === 'string') {
      throw new Error(
        `Expected an address info object. Got a string: ${address}`
      );
    }
    server.on('connection', (socket) => {
      socket.on('data', (data) => {
        const buffer = data.toString();
        if (buffer.length > 3 && buffer.slice(-3, -2) === '#') {
          this.debug(`Command: ${buffer}`);
          this._handleCommand(buffer, socket);
        } else if (buffer !== '+') {
          console.log('Invalid command: %s', buffer);
          socket.write('-');
        }
      });
    });
    return address;
  }

  close() {
    this.server?.close();
    this.server = undefined;
  }

  private _handleCommand(buffer: string, socket: net.Socket) {
    if (buffer.startsWith('+')) {
      buffer = buffer.slice(1); // ignore the leading '+'
    }

    const command = buffer.slice(1, -3); // ignore checksums
    // Acknowledge the command
    socket.write('+');
    this.debug(`Got command: ${command}`);
    if (command === '?') {
      // report sigtrap as the stop reason; the exact reason doesn't matter for backtracing
      this._respond('T05', socket);
    } else if (command.startsWith('Hg') || command.startsWith('Hc')) {
      // Select thread command
      this._respond('OK', socket);
    } else if (command === 'qfThreadInfo') {
      // Get list of threads.
      // Only one thread for now, can be extended to show one thread for each core,
      // if we dump both cores (e.g. on an interrupt watchdog)
      this._respond('m1', socket);
    } else if (command === 'qC') {
      // That single thread is selected.
      this._respond('QC1', socket);
    } else if (command === 'g') {
      // Registers read
      this._respondRegs(socket);
    } else if (command.startsWith('m')) {
      // Memory read
      const [addr, size] = command
        .slice(1)
        .split(',')
        .map((v) => parseInt(v, 16));
      this._respondMem(addr, size, socket);
    } else if (command.startsWith('vKill') || command === 'k') {
      // Quit
      this._respond('OK', socket);
      socket.end();
    } else {
      // Empty response required for any unknown command
      this._respond('', socket);
    }
  }

  private _respond(data: string, socket: net.Socket) {
    // this.debug(`Responding with: ${data}`);
    // calculate checksum
    const dataBytes = Buffer.from(data, 'ascii');
    // this.debug(`Data bytes: ${dataBytes}`);
    const checksum = dataBytes.reduce((sum, byte) => sum + byte, 0) & 0xff;
    // this.debug(`Checksum: ${checksum}`);
    // format and write the response
    const res = `$${data}#${checksum.toString(16).padStart(2, '0')}`;
    socket.write(res);
    this.debug(`Wrote: ${res}`);
    // get the result ('+' or '-')
    // socket.once('data', (ret) => {
    //   this.debug(`Response: ${ret.toString()}`);
    //   if (ret.toString() !== '+') {
    //     this.debug(`GDB responded with '-' to ${res}`);
    //     // socket.end();
    //   }
    // });
  }

  private _respondRegs(socket: net.Socket) {
    let response = '';
    // https://github.com/espressif/esp-idf-monitor/blob/fae383ecf281655abaa5e65433f671e274316d10/esp_idf_monitor/gdb_panic_server.py#L242-L247
    // It loops over the list of register names.
    // For each register name, it gets the register value from panicInfo.regs.
    // It converts the register value to bytes in little-endian byte order.
    // It converts each byte to a hexadecimal string and joins them together.
    // It appends the hexadecimal string to the response string.
    for (const regName of this.regList) {
      const regVal = this.panicInfo.regs[regName] || 0;
      // this.debug(`Register ${regName}: ${regVal}`);
      const regBytes = Buffer.alloc(4);
      regBytes.writeUInt32LE(regVal);
      const regValHex = regBytes.toString('hex');
      // this.debug(`Register ${regName}: ${regValHex}`);
      response += regValHex;
    }
    this.debug(`Register response: ${response}`);
    this._respond(response, socket);
  }

  private _respondMem(startAddr: number, size: number, socket: net.Socket) {
    const stackAddrMin = this.panicInfo.stackBaseAddr;
    const stackData = this.panicInfo.stackData;
    const stackLen = stackData.length;
    const stackAddrMax = stackAddrMin + stackLen;

    const inStack = (addr: number) =>
      stackAddrMin <= addr && addr < stackAddrMax;

    let result = '';
    for (let addr = startAddr; addr < startAddr + size; addr++) {
      if (!inStack(addr)) {
        result += '00';
      } else {
        result += stackData[addr - stackAddrMin].toString(16).padStart(2, '0');
      }
    }

    this._respond(result, socket);
  }
}

const exceptions = [
  { code: 0x0, description: 'Instruction address misaligned' },
  { code: 0x1, description: 'Instruction access fault' },
  { code: 0x2, description: 'Illegal instruction' },
  { code: 0x3, description: 'Breakpoint' },
  { code: 0x4, description: 'Load address misaligned' },
  { code: 0x5, description: 'Load access fault' },
  { code: 0x6, description: 'Store/AMO address misaligned' },
  { code: 0x7, description: 'Store/AMO access fault' },
  { code: 0x8, description: 'Environment call from U-mode' },
  { code: 0x9, description: 'Environment call from S-mode' },
  { code: 0xb, description: 'Environment call from M-mode' },
  { code: 0xc, description: 'Instruction page fault' },
  { code: 0xd, description: 'Load page fault' },
  { code: 0xf, description: 'Store/AMO page fault' },
];

type RiscvFQBN = FQBN & { boardId: Target };

function isRiscvFQBN(fqbn: FQBN): fqbn is RiscvFQBN {
  return isTarget(fqbn.boardId);
}

function buildPanicServerArgs(
  elfPath: string,
  port: number,
  debug = true // TODO: make it configurable
): string[] {
  return [
    '--batch',
    '-n',
    elfPath,
    '-ex', // executes a command
    `set remotetimeout ${debug ? 300 : 2}`, // Set the timeout limit to wait for the remote target to respond to num seconds. The default is 2 seconds. (https://sourceware.org/gdb/current/onlinedocs/gdb.html/Remote-Configuration.html)
    '-ex',
    `target remote :${port}`, // https://sourceware.org/gdb/current/onlinedocs/gdb.html/Server.html#Server
    '-ex',
    'bt',
  ];
}

async function processPanicOutput(
  params: DecodeParams,
  panicInfo: PanicInfo,
  options: DecodeOptions
): Promise<string> {
  const { elfPath, toolPath } = params;
  let server: { close: () => void } | undefined;
  try {
    const gdbServer = new GdbServer({
      panicInfo,
      debug: options.debug,
    });
    const { port } = await gdbServer.start();
    server = gdbServer;

    const args = buildPanicServerArgs(elfPath, port);

    const { debug, signal } = options;
    const stdout = await run(toolPath, args, { debug, signal });

    return stdout;
  } finally {
    server?.close();
  }
}

function toHexString(number: number): string {
  return `0x${number.toString(16).padStart(8, '0')}`;
}

export class InvalidTargetError extends Error {
  constructor(fqbn: FQBN) {
    super(`Invalid target: ${fqbn}`);
    this.name = 'InvalidTargetError';
  }
}

export async function decodeRiscv(
  params: DecodeParams,
  input: string,
  options: DecodeOptions
): Promise<DecodeResult> {
  if (!isRiscvFQBN(params.fqbn)) {
    throw new InvalidTargetError(params.fqbn);
  }
  const target = params.fqbn.boardId;

  const panicInfo = parsePanicOutput({
    input,
    target,
  });

  const stdout = await processPanicOutput(params, panicInfo, options);
  const exception = exceptions.find((e) => e.code === panicInfo.exception);

  const registerLocations: Record<string, string> = {};
  if (typeof panicInfo.regs.MEPC === 'number') {
    registerLocations.MEPC = toHexString(panicInfo.regs.MEPC);
  }
  if (typeof panicInfo.MTVAL === 'number') {
    registerLocations.MTVAL = toHexString(panicInfo.MTVAL);
  }

  const stacktraceLines = parseGDBOutput(stdout);

  return {
    exception: exception ? [exception.description, exception.code] : undefined,
    allocLocation: undefined,
    registerLocations,
    stacktraceLines,
  };
}

function parseGDBOutput(stdout: string, debug: Debug = riscvDebug): GDBLine[] {
  const gdbLines: GDBLine[] = [];
  const regex = /^#\d+\s+([\w:~<>]+)\s*\(([^)]*)\)\s*(?:at\s+([\S]+):(\d+))?/;

  for (const line of stdout.split(/\r?\n|\r/)) {
    const match = regex.exec(line);
    if (match) {
      const method = match[1];
      const rawArgs = match[2]; // raw args
      const file = match[3];
      const lineNum = match[4];

      const args: Record<string, string> = {};
      if (rawArgs) {
        rawArgs.split(',').forEach((arg) => {
          const keyValue = arg.trim().match(/(\w+)\s*=\s*(\S+)/);
          if (keyValue) {
            args[keyValue[1]] = keyValue[2];
          }
        });
      }

      const parsedLine: ParsedGDBLine = {
        method,
        address: rawArgs || '??', // Could be a memory address if not a method
        file,
        line: lineNum,
        args,
      };

      gdbLines.push(parsedLine);
    } else {
      // Try fallback for addresses without function names
      const fallbackRegex = /^#\d+\s+0x([0-9a-fA-F]+)\s*in\s+(\?\?)/;
      const fallbackMatch = fallbackRegex.exec(line);
      if (fallbackMatch) {
        gdbLines.push({
          address: `0x${fallbackMatch[1]}`,
          line: '??',
        });
      }
    }
  }
  return gdbLines;
}

/**
 * (non-API)
 */
export const __tests = {
  createRegNameValidator,
  GdbServer,
  isTarget,
  parse,
  parsePanicOutput,
} as const;
