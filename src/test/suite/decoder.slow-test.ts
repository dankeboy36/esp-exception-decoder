import { before, Suite } from 'mocha';
import assert from 'node:assert/strict';
import path from 'node:path';
import type {
  ArduinoState,
  BoardDetails,
  BuildProperties,
  CompileSummary,
} from 'vscode-arduino-api';
import {
  __tests,
  createDecodeParams,
  decode,
  DecodeResult,
  GDBLine,
  Location,
  ParsedGDBLine,
} from '../../decoder';
import { run } from '../../utils';
import type {
  CliContext,
  TestEnv,
  ToolsEnv,
  ToolsInstallType,
} from '../testEnv';
import { esp32c3Input } from './riscv.test';

const { findToolPath } = __tests;
const sketchesPath = path.join(__dirname, '../../../src/test/sketches/');

type PlatformId = [vendor: string, arch: string];
const esp32Boards = ['esp32', 'esp32s2', 'esp32s3', 'esp32c3'] as const;
type ESP32Board = (typeof esp32Boards)[number];
const esp8266Boards = ['generic'] as const;
type ESP8266Board = (typeof esp8266Boards)[number];

interface FindToolTestParams {
  readonly id: PlatformId;
  readonly toolsInstallType: ToolsInstallType;
  readonly boards: ESP32Board[] | ESP8266Board[];
}

const expectedToolFilenames: Record<ESP32Board | ESP8266Board, string> = {
  esp32: 'xtensa-esp32-elf-gdb',
  esp32s2: 'xtensa-esp32s2-elf-gdb',
  esp32s3: 'xtensa-esp32s3-elf-gdb',
  esp32c3: 'riscv32-esp-elf-gdb',
  generic: 'xtensa-lx106-elf-gdb',
};

const findToolTestParams: FindToolTestParams[] = [
  {
    id: ['esp32', 'esp32'],
    toolsInstallType: 'cli',
    boards: [...esp32Boards],
  },
  {
    id: ['espressif', 'esp32'],
    toolsInstallType: 'git',
    boards: [...esp32Boards],
  },
  {
    id: ['esp8266', 'esp8266'],
    toolsInstallType: 'cli',
    boards: [...esp8266Boards],
  },
];

function describeFindToolSuite(params: FindToolTestParams): Suite {
  const [vendor, arch] = params.id;
  const platformId = `${vendor}:${arch}`;
  return describe(`findToolPath for '${platformId}' platform installed via '${params.toolsInstallType}'`, () => {
    let testEnv: TestEnv;

    before(function () {
      testEnv = this.currentTest?.ctx?.['testEnv'];
      assert.notEqual(testEnv, undefined);
    });

    params.boards
      .map((boardId) => ({ fqbn: `${platformId}:${boardId}`, boardId }))
      .map(({ fqbn, boardId }) =>
        it(`should find the tool path for '${fqbn}'`, async function () {
          this.slow(10_000);
          const { cliContext, toolsEnvs } = testEnv;
          const boardDetails = await getBoardDetails(
            cliContext,
            toolsEnvs[params.toolsInstallType],
            fqbn
          );
          const actual = await findToolPath(boardDetails);
          assert.notEqual(
            actual,
            undefined,
            `could not find tool path for '${fqbn}'`
          );
          // filename without the extension independently from the OS
          const actualFilename = path.basename(
            <string>actual,
            path.extname(<string>actual)
          );
          assert.strictEqual(actualFilename, expectedToolFilenames[boardId]);
          const stdout = await run(<string>actual, ['--version'], {
            silent: true,
            silentError: true,
          });
          // TODO: assert GDB version?
          assert.strictEqual(
            stdout.includes('GNU gdb'),
            true,
            `output does not contain 'GNU gdb': ${stdout}`
          );
        })
      );
  });
}

interface CreateArduinoStateParams {
  testEnv: TestEnv;
  fqbn: string;
  sketchPath: string;
}

async function createArduinoState(
  params: CreateArduinoStateParams
): Promise<ArduinoState> {
  const { testEnv, fqbn, sketchPath } = params;
  const [boardDetails, compileSummary] = await Promise.all([
    getBoardDetails(testEnv.cliContext, testEnv.toolsEnvs.cli, fqbn),
    compileSketch(testEnv.cliContext, testEnv.toolsEnvs.cli, fqbn, sketchPath),
  ]);

  return {
    fqbn,
    sketchPath,
    boardDetails,
    compileSummary,
    dataDirPath: testEnv.toolsEnvs['cli'].dataDirPath,
    userDirPath: testEnv.toolsEnvs['cli'].userDirPath,
    port: undefined,
  };
}

function describeDecodeSuite(params: DecodeTestParams): Suite {
  const { input, fqbn, sketchPath, expected, skip } = params;
  const assertDecodeResult = createAssertDecodeResult(sketchPath);
  let testEnv: TestEnv;
  let arduinoState: ArduinoState;

  return describe(`decode '${path.basename(
    sketchPath
  )}' sketch on '${fqbn}'`, () => {
    before(async function () {
      if (skip) {
        console.info(`[TEST SKIP] ${skip}`);
        return this.skip();
      }
      testEnv = this.currentTest?.ctx?.['testEnv'];
      assert.notEqual(testEnv, undefined);
      arduinoState = await createArduinoState({
        testEnv,
        fqbn,
        sketchPath,
      });
    });

    it('should decode', async function () {
      if (skip) {
        return this.skip();
      }
      this.slow(10_000);
      const params = await createDecodeParams(arduinoState);
      const actual = await decode(params, input);
      assertDecodeResult(actual, expected);
    });
  });
}

// To fix the path case issue on Windows:
//      -      "file": "D:\\a\\esp-exception-decoder\\esp-exception-decoder\\src\\test\\sketches\\riscv_1/riscv_1.ino"
//      +      "file": "d:\\a\\esp-exception-decoder\\esp-exception-decoder\\src\\test\\sketches\\riscv_1\\riscv_1.ino"
function driveLetterToLowerCaseIfWin32(str: string) {
  if (process.platform === 'win32' && /^[a-zA-Z]:\\/.test(str)) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
  return str;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertObjectContains(actual: any, expected: any) {
  for (const key of Object.keys(expected)) {
    assert.deepStrictEqual(
      actual[key],
      expected[key],
      `Mismatch on key: ${key}, expected: ${expected[key]}, actual: ${actual[key]}`
    );
  }
}

function createAssertDecodeResult(expectedSketchPath: string) {
  const expectedSketchFile = path.join(
    expectedSketchPath,
    `${path.basename(expectedSketchPath)}.ino`
  );

  return (actual: DecodeResult, expected: DecodeResultMatcher) => {
    assert.deepStrictEqual(actual.exception, expected.exception);
    assert.deepStrictEqual(
      actual.registerLocations,
      expected.registerLocations
    );

    assert.strictEqual(
      actual.stacktraceLines.length,
      expected.stacktraceLines.length
    );

    for (let i = 0; i < actual.stacktraceLines.length; i++) {
      const actualLine = actual.stacktraceLines[i];
      const expectedLine = expected.stacktraceLines[i];
      if (!('file' in expectedLine)) {
        assert.deepStrictEqual(actualLine, expectedLine);
        continue;
      }

      assertObjectContains(actualLine, {
        method: expectedLine.method,
        address: expectedLine.address,
        line: expectedLine.line,
        args: expectedLine.args,
      });

      if (typeof expectedLine.file === 'function') {
        const assertFile = expectedLine.file;
        assert.ok(assertFile((<ParsedGDBLine>actualLine).file));
      } else {
        assert.strictEqual(
          driveLetterToLowerCaseIfWin32((<ParsedGDBLine>actualLine).file),
          driveLetterToLowerCaseIfWin32(expectedSketchFile)
        );
      }
    }
  };
}

type GDBLineMatcher = Omit<ParsedGDBLine, 'file'> & {
  file: (actualFile: string) => boolean;
};
type DecodeResultMatcher = Omit<DecodeResult, 'stacktraceLines'> & {
  stacktraceLines: (GDBLine | ParsedGDBLine | GDBLineMatcher)[];
};

interface DecodeTestParams extends Omit<CreateArduinoStateParams, 'testEnv'> {
  input: string;
  expected: DecodeResultMatcher;
  skip?: boolean | string;
}

const esp32h2Input = `Guru Meditation Error: Core  0 panic'ed (Breakpoint). Exception was unhandled.

Core  0 register dump:
MEPC    : 0x42000054  RA      : 0x42000054  SP      : 0x40816af0  GP      : 0x4080bcc4  
TP      : 0x40816b40  T0      : 0x400184be  T1      : 0x4080e000  T2      : 0x00000000  
S0/FP   : 0x420001bc  S1      : 0x4080e000  A0      : 0x00000001  A1      : 0x00000001  
A2      : 0x4080e000  A3      : 0x4080e000  A4      : 0x00000000  A5      : 0x600c5090  
A6      : 0xfa000000  A7      : 0x00000014  S2      : 0x00000000  S3      : 0x00000000  
S4      : 0x00000000  S5      : 0x00000000  S6      : 0x00000000  S7      : 0x00000000  
S8      : 0x00000000  S9      : 0x00000000  S10     : 0x00000000  S11     : 0x00000000  
T3      : 0x4080e000  T4      : 0x00000001  T5      : 0x4080e000  T6      : 0x00000001  
MSTATUS : 0x00001881  MTVEC   : 0x40800001  MCAUSE  : 0x00000003  MTVAL   : 0x00009002  
MHARTID : 0x00000000  

Stack memory:
40816af0: 0x00000000 0x00000000 0x00000000 0x42001b6c 0x00000000 0x00000000 0x00000000 0x4080670a
40816b10: 0x00000000 0x00000000 0ESP-ROM:esp32h2-20221101
Build:Nov  1 2022
`;

const esp32WroomDaInput = `Guru Meditation Error: Core  1 panic'ed (Unhandled debug exception). 
Debug exception reason: BREAK instr 
Core  1 register dump:
PC      : 0x400d15af  PS      : 0x00060536  A0      : 0x800d2f9b  A1      : 0x3ffb2250  
A2      : 0x00000000  A3      : 0x00000003  A4      : 0x00000001  A5      : 0xffffffff  
A6      : 0xffffffff  A7      : 0x00000020  A8      : 0x800d15af  A9      : 0x3ffb2230  
A10     : 0x00002710  A11     : 0x00002580  A12     : 0x00000000  A13     : 0x00002580  
A14     : 0x00000001  A15     : 0x00000001  SAR     : 0x0000000c  EXCCAUSE: 0x00000001  
EXCVADDR: 0x00000000  LBEG    : 0x40085ce8  LEND    : 0x40085cf3  LCOUNT  : 0xffffffff  


Backtrace: 0x400d15ac:0x3ffb2250 0x400d2f98:0x3ffb2270 0x40088be9:0x3ffb2290`;

const esp8266Input = `Exception (28):
epc1=0x4020107b epc2=0x00000000 epc3=0x00000000 excvaddr=0x00000000 depc=0x00000000

>>>stack>>>

ctx: cont
sp: 3ffffe60 end: 3fffffd0 offset: 0150
3fffffb0:  feefeffe 00000000 3ffee55c 4020195c  
3fffffc0:  feefeffe feefeffe 3fffdab0 40100d19  
<<<stack<<<`;

const skip =
  process.platform === 'win32'
    ? "'fatal error: bits/c++config.h: No such file or directory' due to too long path on Windows (https://github.com/espressif/arduino-esp32/issues/9654 + https://github.com/arendst/Tasmota/issues/1217#issuecomment-358056267)"
    : false;

const decodeTestParams: DecodeTestParams[] = [
  {
    skip,
    input: esp32c3Input,
    fqbn: 'esp32:esp32:esp32c3',
    sketchPath: path.join(sketchesPath, 'riscv_1'),
    expected: {
      exception: ['Load access fault', 5],
      registerLocations: {
        MEPC: '0x4200007e',
        MTVAL: '0x00000000',
      },
      stacktraceLines: [
        {
          method: 'a::geta',
          address: 'this=0x0',
          line: '11',
          args: {
            this: '0x0',
          },
          file: path.join(sketchesPath, 'riscv_1/riscv_1.ino'),
        },
        {
          method: 'loop',
          address: '??',
          line: '21',
          args: {},
          file: path.join(sketchesPath, 'riscv_1/riscv_1.ino'),
        },
        {
          address: '0x4c1c0042',
          line: '??',
        },
      ],
      allocLocation: undefined,
    },
  },
  {
    skip,
    input: esp32h2Input,
    fqbn: 'esp32:esp32:esp32h2',
    sketchPath: path.join(sketchesPath, 'AE'),
    expected: {
      exception: ['Breakpoint', 3],
      registerLocations: {
        MEPC: '0x42000054',
        MTVAL: '0x00009002',
      },
      stacktraceLines: [
        {
          method: 'loop',
          address: '??',
          line: '7',
          args: {},
          file: path.join(sketchesPath, 'AE/AE.ino'),
        },
        {
          address: '0x6c1b0042',
          line: '??',
        },
      ],
      allocLocation: undefined,
    },
  },
  {
    input: esp32WroomDaInput,
    fqbn: 'esp32:esp32:esp32da',
    expected: {
      exception: undefined,
      registerLocations: {
        PC: <Location>{
          address: '0x400d15af',
          method: 'loop()',
          file: path.join(sketchesPath, 'AE/AE.ino'),
          line: '7',
        },
        EXCVADDR: '0x00000000',
      },
      stacktraceLines: [
        {
          address: '0x400d15ac',
          method: 'loop()',
          file: path.join(sketchesPath, 'AE/AE.ino'),
          line: '6',
        },
        {
          address: '0x400d2f98',
          method: 'loopTask(void*)',
          file: (actualFile) => actualFile.endsWith('main.cpp'),
          line: '74',
        },
        {
          address: '0x40088be9',
          method: 'vPortTaskWrapper',
          file: (actualFile) => actualFile.endsWith('port.c'),
          line: '139',
        },
      ],
      allocLocation: undefined,
    },
    sketchPath: path.join(sketchesPath, 'AE'),
  },
  {
    skip,
    fqbn: 'esp8266:esp8266:generic',
    input: esp8266Input,
    sketchPath: path.join(sketchesPath, 'AE'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected: {
      exception: [
        'LoadProhibited: A load referenced a page mapped with an attribute that does not permit loads',
        28,
      ],
      registerLocations: {
        PC: '0x4020107b',
        EXCVADDR: '0x00000000',
      },
      stacktraceLines: [
        {
          address: '0x4020195c',
          method: 'user_init()',
          file: (actualFile) => actualFile.endsWith('core_esp8266_main.cpp'),
          line: '676',
        },
      ],
      allocLocation: undefined,
    },
  },
];

async function getBoardDetails(
  cliContext: CliContext,
  toolsEnv: ToolsEnv,
  fqbn: string
): Promise<BoardDetails> {
  const { cliPath } = cliContext;
  const { cliConfigPath } = toolsEnv;
  const stdout = await run(cliPath, [
    'board',
    'details',
    '-b',
    fqbn,
    '--config-file',
    cliConfigPath,
    '--format',
    'json',
  ]);
  const buildProperties = JSON.parse(stdout).build_properties;
  return createBoardDetails(fqbn, buildProperties);
}

async function compileSketch(
  cliContext: CliContext,
  toolsEnv: ToolsEnv,
  fqbn: string,
  sketchPath: string
): Promise<CompileSummary> {
  const { cliPath } = cliContext;
  const { cliConfigPath } = toolsEnv;
  const stdout = await run(cliPath, [
    'compile',
    sketchPath,
    '-b',
    fqbn,
    '--config-file',
    cliConfigPath,
    '--format',
    'json',
  ]);

  const cliCompileSummary = JSON.parse(stdout);
  return {
    buildPath: cliCompileSummary.builder_result.build_path,
    buildProperties: {},
    usedLibraries: [],
    executableSectionsSize: [],
    boardPlatform: undefined,
    buildPlatform: undefined,
  };
}

function createBoardDetails(
  fqbn: string,
  buildProperties: string[] | Record<string, string> = {}
): BoardDetails {
  return {
    fqbn,
    buildProperties: Array.isArray(buildProperties)
      ? parseBuildProperties(buildProperties)
      : buildProperties,
    configOptions: [],
    programmers: [],
    toolsDependencies: [],
  };
}

export function parseBuildProperties(properties: string[]): BuildProperties {
  return properties.reduce((acc, curr) => {
    const entry = parseProperty(curr);
    if (entry) {
      const [key, value] = entry;
      acc[key] = value;
    }
    return acc;
  }, <Record<string, string>>{});
}

const propertySep = '=';
function parseProperty(
  property: string
): [key: string, value: string] | undefined {
  const segments = property.split(propertySep);
  if (segments.length < 2) {
    console.warn(`Could not parse build property: ${property}.`);
    return undefined;
  }
  const [key, ...rest] = segments;
  if (!key) {
    console.warn(`Could not determine property key from raw: ${property}.`);
    return undefined;
  }
  const value = rest.join(propertySep);
  return [key, value];
}

describe('decoder (slow)', () => {
  findToolTestParams.map(describeFindToolSuite);
  decodeTestParams.map(describeDecodeSuite);

  it(`should throw an error when the board's architecture is unsupported`, async () => {
    await assert.rejects(
      () => findToolPath(createBoardDetails('a:b:c')),
      /Unsupported board architecture: 'a:b:c'/
    );
  });
});
