import { before } from 'mocha';
import assert from 'node:assert/strict';
import path from 'node:path';
import { run } from '../../utils';
import type { TestEnv } from '../testEnv';
import { ArduinoState } from 'vscode-arduino-api';
import { createDecodeParams } from '../../decoder';
import { decodeRiscv } from '../../riscv';
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
    const result = await decodeRiscv(params, esp32c3Input);
    assert.deepStrictEqual(result, {
      exception: ['Load access fault', 5],
      allocLocation: undefined,
      registerLocations: {
        MEPC: '0x4200007e',
        MTVAL: '0x00000000',
      },
      stacktraceLines: [
        {
          method: 'a::geta',
          address: 'this=0x0',
          file: path.join(riscv1SketchPath, 'riscv_1.ino'),
          line: '11',
          args: {
            this: '0x0',
          },
        },
        {
          method: 'loop',
          address: '??',
          file: path.join(riscv1SketchPath, 'riscv_1.ino'),
          line: '21',
          args: {},
        },
        {
          address: '0x4c1c0042',
          line: '??',
        },
      ],
    });
  });
});
