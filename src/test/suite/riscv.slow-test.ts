import { before } from 'mocha';
import assert from 'node:assert/strict';
import path, { basename } from 'node:path';
import type { ArduinoState } from 'vscode-arduino-api';
import {
  __tests,
  createDecodeParams,
  decode,
  DecodeResult,
  isParsedGDBLine,
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

  return describe(`decode '${basename(sketchPath)} sketch on ${fqbn}`, () => {
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

  return (actual: DecodeResult, expected: DecodeResult) => {
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
      if (isParsedGDBLine(expectedLine)) {
        assertObjectContains(actualLine, {
          method: expectedLine.method,
          address: expectedLine.address,
          line: expectedLine.line,
          args: expectedLine.args,
        });

        assert.strictEqual(
          driveLetterToLowerCaseIfWin32((<ParsedGDBLine>actualLine).file),
          driveLetterToLowerCaseIfWin32(expectedSketchFile)
        );
      } else {
        assert.deepStrictEqual(actualLine, expectedLine);
      }
    }
  };
}

interface DecodeTestParams extends Omit<CreateArduinoStateParams, 'testEnv'> {
  input: string;
  expected: DecodeResult;
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
];

describe('riscv (slow)', () => {
  params.map(describeSuite);
});
