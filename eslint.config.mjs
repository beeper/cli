import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'

export default [
  ...oclif,
  prettier,
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '.packs/**',
      'packages/cli/README.md',
    ],
  },
]
