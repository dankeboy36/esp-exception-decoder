// Enable `debug` coloring in VS Code _Debug Console_
// https://github.com/debug-js/debug/issues/641#issuecomment-490706752
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(process as any).browser = true;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).window = { process: { type: 'renderer' } };

import debug from 'debug';
import glob from 'glob';
import Mocha, { MochaOptions } from 'mocha';
import path from 'node:path';
import { TestEnv, setupTestEnv } from '../testEnv';

export async function run(): Promise<void> {
  const options: MochaOptions = {
    ui: 'bdd',
    color: true,
  };
  // The debugger cannot be enabled with the `DEBUG` env variable.
  // https://github.com/microsoft/vscode/blob/c248f9ec0cf272351175ccf934054b18ffbf18c6/src/vs/base/common/processes.ts#L141
  if (typeof process.env['TEST_DEBUG'] === 'string') {
    debug.enable(process.env['TEST_DEBUG']);
    debug.selectColor(process.env['TEST_DEBUG']);
  }
  const context = testContext();
  let testEnv: TestEnv | undefined = undefined;
  if (context) {
    options.timeout = noTestTimeout() ? 0 : 60_000;
    // Download Arduino CLI, unzip it and make it available for the tests
    // Initializes a CLI config, configures with ESP32 and ESP8266 and installs the platforms.
    testEnv = await setupTestEnv();
  } else {
    options.timeout = noTestTimeout() ? 0 : 2_000;
  }
  const mocha = new Mocha(options);
  const testsRoot = path.resolve(__dirname, '..');
  if (testEnv) {
    mocha.suite.ctx['testEnv'] = testEnv;
  }

  let testsPattern: string;
  if (context === 'all') {
    testsPattern = '**/*test.js';
  } else if (context === 'slow') {
    testsPattern = '**/*.slow-test.js';
  } else {
    testsPattern = '**/riscv.test.js';
  }
  return new Promise((resolve, reject) => {
    glob(testsPattern, { cwd: testsRoot }, (err, files) => {
      if (err) {
        return reject(err);
      }
      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  });
}

function testContext(): 'slow' | 'all' | undefined {
  if (typeof process.env.CLI_TEST_CONTEXT === 'string') {
    const value = process.env.CLI_TEST_CONTEXT;
    if (/all/i.test(value)) {
      return 'all';
    }
    if (/slow/i.test(value)) {
      return 'slow';
    }
  }
  return undefined;
}

function noTestTimeout(): boolean {
  return (
    typeof process.env.NO_TEST_TIMEOUT === 'string' &&
    /true/i.test(process.env.NO_TEST_TIMEOUT)
  );
}
