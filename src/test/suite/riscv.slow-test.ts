import { before } from 'mocha';
import assert from 'node:assert/strict';
import path, { basename } from 'node:path';
import type { ArduinoState } from 'vscode-arduino-api';
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
import type { TestEnv } from '../testEnv';
import { esp32c3Input } from './riscv.test';

const sketchesPath = path.join(__dirname, '../../../src/test/sketches/');

const defaultPropsToCopy = [__tests.buildTarch, __tests.buildTarget];

interface CreateArduinoStateParams {
  testEnv: TestEnv;
  fqbn: string;
  sketchPath: string;
  additionalPropsToCopy?: string[];
}

async function createArduinoState(
  params: CreateArduinoStateParams
): Promise<ArduinoState> {
  const { testEnv, fqbn, sketchPath, additionalPropsToCopy } = params;
  const { cliPath } = testEnv.cliContext;
  const { cliConfigPath } = testEnv.toolsEnvs.cli;
  const [boardDetailsStdout, compileStdout] = await Promise.all([
    run(cliPath, [
      'board',
      'details',
      '-b',
      fqbn,
      '--config-file',
      cliConfigPath,
      '--format',
      'json',
    ]),
    run(cliPath, [
      'compile',
      sketchPath,
      '-b',
      fqbn,
      '--config-file',
      cliConfigPath,
      '--format',
      'json',
    ]),
  ]);

  const cliBoardDetails = JSON.parse(boardDetailsStdout);
  const cliCompileSummary = JSON.parse(compileStdout);

  const propsToCopy = [...defaultPropsToCopy, ...(additionalPropsToCopy ?? [])];
  const buildProperties: Record<string, string> = {};
  for (const entry of cliBoardDetails.build_properties) {
    const [key, value] = entry.split('=');
    if (propsToCopy.includes(key)) {
      buildProperties[key] = value;
    }
  }

  return {
    fqbn,
    sketchPath,
    boardDetails: {
      fqbn,
      programmers: [],
      toolsDependencies: [],
      configOptions: [],
      buildProperties,
    },
    compileSummary: {
      buildPath: cliCompileSummary.builder_result.build_path,
      buildProperties: {},
      usedLibraries: [],
      executableSectionsSize: [],
      boardPlatform: undefined,
      buildPlatform: undefined,
    },
    dataDirPath: testEnv.toolsEnvs['cli'].dataDirPath,
    userDirPath: testEnv.toolsEnvs['cli'].userDirPath,
    port: undefined,
  };
}

function describeSuite(params: DecodeTestParams) {
  const { input, fqbn, sketchPath, additionalPropsToCopy, expected } = params;
  const assertDecodeResult = createAssertDecodeResult(sketchPath);
  let testEnv: TestEnv;
  let arduinoState: ArduinoState;

  return describe(`decode '${basename(
    sketchPath
  )}' sketch on '${fqbn}'`, () => {
    before(async function () {
      testEnv = this.currentTest?.ctx?.['testEnv'];
      assert.notEqual(testEnv, undefined);
      arduinoState = await createArduinoState({
        testEnv,
        fqbn,
        sketchPath,
        additionalPropsToCopy,
      });
    });

    it('should decode', async () => {
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

const params: DecodeTestParams[] = [
  {
    input: esp32c3Input,
    fqbn: 'esp32:esp32:esp32c3',
    sketchPath: path.join(sketchesPath, 'riscv_1'),
    additionalPropsToCopy: ['runtime.tools.riscv32-esp-elf-gdb.path'],
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
    input: esp32h2Input,
    fqbn: 'esp32:esp32:esp32h2',
    sketchPath: path.join(sketchesPath, 'AE'),
    additionalPropsToCopy: ['runtime.tools.riscv32-esp-elf-gdb.path'],
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
    additionalPropsToCopy: ['runtime.tools.xtensa-esp-elf-gdb.path'],
  },
];

describe('riscv (slow)', () => {
  params.map(describeSuite);
});
