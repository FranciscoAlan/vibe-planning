const base = require('../../packages/config/eslint-config/base.js');
const globals = require('globals');

/** apps/api extends the shared base config; spec/e2e files also get Vitest globals. */
module.exports = [
  ...base,
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
];
