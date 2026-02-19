const noTestTimeout =
  typeof process.env.NO_TEST_TIMEOUT === 'string' &&
  /true/i.test(process.env.NO_TEST_TIMEOUT)

export default {
  tests: [
    {
      label: 'extension-host',
      files: 'out/test/**/*.test.js',
      extensionDevelopmentPath: process.cwd(),
      skipExtensionDependencies: true,
      env: {
        TEST_DEBUG: process.env.DEBUG,
        NO_COLOR: undefined,
        FORCE_COLOR: '1',
        MOCHA_COLORS: '1',
      },
      mocha: {
        ui: 'bdd',
        color: true,
        timeout: noTestTimeout ? 0 : 2_000,
      },
    },
  ],
  coverage: {
    reporter: ['text-summary', 'html', 'lcovonly'],
    includeAll: true,
    exclude: [
      'src/test/**',
      'out/test/**',
      '**/*.test.*',
      '**/test/**',
      '**/__tests__/**',
    ],
  },
}
