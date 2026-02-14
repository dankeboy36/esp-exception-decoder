// Enable `debug` coloring in VS Code _Debug Console_
// https://github.com/debug-js/debug/issues/641#issuecomment-490706752
import path from 'node:path'

import debug from 'debug'
import { glob } from 'glob'
import Mocha, { MochaOptions } from 'mocha'

const NYC = require('nyc')
const baseConfig = require('@istanbuljs/nyc-config-typescript')

export async function run(): Promise<void> {
  // nyc setup

  let nyc: any | undefined
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
    })

    await nyc.reset()
    await nyc.wrap()
    Object.keys(require.cache)
      .filter((f) => nyc.exclude.shouldInstrument(f))
      .forEach((m) => {
        console.warn('Module loaded before NYC, invalidating:', m)
        delete require.cache[m]
        require(m)
      })
  }

  // mocha setup
  const options: MochaOptions = {
    ui: 'bdd',
    color: true,
    timeout: noTestTimeout() ? 0 : 2_000,
  }
  // The debugger cannot be enabled with the `DEBUG` env variable.
  // https://github.com/microsoft/vscode/blob/c248f9ec0cf272351175ccf934054b18ffbf18c6/src/vs/base/common/processes.ts#L141
  if (typeof process.env['TEST_DEBUG'] === 'string') {
    debug.enable(process.env['TEST_DEBUG'])
    debug.selectColor(process.env['TEST_DEBUG'])
  }
  const mocha = new Mocha(options)
  const testsRoot = path.resolve(__dirname, '..')

  const files = await glob('**/*.test.js', { cwd: testsRoot })
  files.forEach((file) => mocha.addFile(path.resolve(testsRoot, file)))
  const failures = await new Promise<number>((resolve) => mocha.run(resolve))

  if (nyc) {
    // write coverage
    await nyc.writeCoverageFile()
    console.log(await captureStdout(nyc.report.bind(nyc)))
  }

  if (failures > 0) {
    throw new Error(`${failures} tests failed.`)
  }
}

function noTestTimeout(): boolean {
  return (
    typeof process.env.NO_TEST_TIMEOUT === 'string' &&
    /true/i.test(process.env.NO_TEST_TIMEOUT)
  )
}

function runTestCoverage(): boolean {
  return !(
    typeof process.env.NO_TEST_COVERAGE === 'string' &&
    /true/i.test(process.env.NO_TEST_COVERAGE)
  )
}

async function captureStdout(task: () => Promise<unknown>): Promise<string> {
  const originalWrite = process.stdout.write
  let buffer = ''
  process.stdout.write = (s) => {
    buffer = buffer + s
    return true
  }
  try {
    await task()
  } finally {
    process.stdout.write = originalWrite
  }
  return buffer
}
