// @ts-check

import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import neostandard from 'neostandard'

export default [
  ...neostandard({
    semi: false,
    ts: true,
    ignores: ['out', 'dist', 'node_modules'],
  }),
  {
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      curly: 'warn',
      eqeqeq: 'warn',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/no-tabs': 'off',
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      'import/first': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
        },
      ],
      'import/newline-after-import': 'error',
    },
  },
]
