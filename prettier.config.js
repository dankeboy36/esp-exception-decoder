// @ts-check

/** @type {import('prettier').Config} */
module.exports = {
  singleQuote: true,
  tabWidth: 2,
  semi: false,
  useTabs: false,
  printWidth: 80,
  endOfLine: 'auto',
  trailingComma: 'es5',
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2,
      },
    },
  ],
  plugins: [
    'prettier-plugin-packagejson',
    'prettier-plugin-organize-imports',
    'prettier-plugin-jsdoc', // must be the last one: https://github.com/hosseinmd/prettier-plugin-jsdoc/issues/212#issuecomment-1826906200
  ],
  tsdoc: true,
  jsdocCommentLineStrategy: 'singleLine',
}
