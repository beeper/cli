import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '.packs/**',
      '.upstream/**',
      'packages/cli/README.md',
    ],
  },
  ...oclif,
  prettier,
  {
    languageOptions: {
      globals: {
        Bun: 'readonly',
      },
    },
    rules: {
      'import/no-unresolved': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
      'no-await-in-loop': 'off',
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-union-types': 'off',
      'unicorn/prefer-string-replace-all': 'off',
    },
  },
]
