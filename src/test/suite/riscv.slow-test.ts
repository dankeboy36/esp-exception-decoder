import { before } from 'mocha';
import assert from 'node:assert/strict';
import path from 'node:path';
import type { ArduinoState } from 'vscode-arduino-api';
import { createDecodeParams, decode, ParsedGDBLine } from '../../decoder';
import { run } from '../../utils';
import type { TestEnv } from '../testEnv';
import { esp32c3Input } from './riscv.test';

const sketchesPath = path.join(__dirname, '../../../src/test/sketches/');
const riscv1SketchPath = path.join(sketchesPath, 'riscv_1');

describe('riscv (slow)', () => {
  const fqbn = 'esp32:esp32:esp32c3';
  let testEnv: TestEnv;
  let arduinoState: ArduinoState;

  before(async function () {
    testEnv = this.currentTest?.ctx?.['testEnv'];
    assert.notEqual(testEnv, undefined);

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
        riscv1SketchPath,
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

    const propsToCopy = [
      'build.tarch',
      'build.target',
      'runtime.tools.riscv32-esp-elf-gdb.path',
    ];
    const buildProperties: Record<string, string> = {};
    for (const entry of cliBoardDetails.build_properties) {
      const [key, value] = entry.split('=');
      if (propsToCopy.includes(key)) {
        buildProperties[key] = value;
      }
    }

    arduinoState = {
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
      fqbn: 'esp32:esp32:esp32c3',
      sketchPath: riscv1SketchPath,
    };
  });

  it('should decode', async () => {
    const params = await createDecodeParams(arduinoState);
    const result = await decode(params, esp32c3Input);
    assert.deepStrictEqual(result.exception, ['Load access fault', 5]);
    assert.deepStrictEqual(result.registerLocations, {
      MEPC: '0x4200007e',
      MTVAL: '0x00000000',
    });
    assertObjectContains(result.stacktraceLines[0], {
      method: 'a::geta',
      address: 'this=0x0',
      line: '11',
      args: {
        this: '0x0',
      },
    });
    assertObjectContains(result.stacktraceLines[1], {
      method: 'loop',
      address: '??',
      line: '21',
      args: {},
    });
    assertObjectContains(result.stacktraceLines[2], {
      address: '0x4c1c0042',
      line: '??',
    });

    assert.strictEqual(
      driveLetterToLowerCaseIfWin32(
        (<ParsedGDBLine>result.stacktraceLines[0]).file
      ),
      driveLetterToLowerCaseIfWin32(path.join(riscv1SketchPath, 'riscv_1.ino'))
    );
    assert.strictEqual(
      driveLetterToLowerCaseIfWin32(
        (<ParsedGDBLine>result.stacktraceLines[1]).file
      ),
      driveLetterToLowerCaseIfWin32(path.join(riscv1SketchPath, 'riscv_1.ino'))
    );
    assert.strictEqual(
      (<ParsedGDBLine>result.stacktraceLines[2]).file,
      undefined
    );
  });

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
});
