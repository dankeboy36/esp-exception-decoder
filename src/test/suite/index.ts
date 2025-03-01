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
import { promisify } from 'node:util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NYC = require('nyc');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const baseConfig = require('@istanbuljs/nyc-config-typescript');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tty = require('node:tty');
if (!tty.getWindowSize) {
  tty.getWindowSize = (): number[] => {
    return [80, 75];
  };
}

export async function run(): Promise<void> {
  // nyc setup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nyc: any | undefined = undefined;
  if (runTestCoverage()) {
    nyc = new NYC({
      ...baseConfig,
      cwd: path.join(__dirname, '..', '..', '..'),
      reporter: ['text'],
      all: true,
      silent: false,
      instrument: true,
      hookRequire: true,
      hookRunInContext: true,
      hookRunInThisContext: true,
      include: ['out/**/*.js'],
      exclude: ['out/test/**'],
    });

    await nyc.reset();
    await nyc.wrap();
    Object.keys(require.cache)
      .filter((f) => nyc.exclude.shouldInstrument(f))
      .forEach((m) => {
        console.warn('Module loaded before NYC, invalidating:', m);
        delete require.cache[m];
        require(m);
      });
  }

  // mocha setup
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
    testsPattern = '**/*.test.js';
  }

  const files = await promisify(glob)(testsPattern, { cwd: testsRoot });
  files.forEach((file) => mocha.addFile(path.resolve(testsRoot, file)));
  const failures = await new Promise<number>((resolve) => mocha.run(resolve));

  if (nyc) {
    // write coverage
    await nyc.writeCoverageFile();
    console.log(await captureStdout(nyc.report.bind(nyc)));
  }

  if (failures > 0) {
    throw new Error(`${failures} tests failed.`);
  }
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

function runTestCoverage(): boolean {
  return !(
    typeof process.env.NO_TEST_COVERAGE === 'string' &&
    /true/i.test(process.env.NO_TEST_COVERAGE)
  );
}

async function captureStdout(task: () => Promise<unknown>): Promise<string> {
  const originalWrite = process.stdout.write;
  let buffer = '';
  process.stdout.write = (s) => {
    buffer = buffer + s;
    return true;
  };
  try {
    await task();
  } finally {
    process.stdout.write = originalWrite;
  }
  return buffer;
}
