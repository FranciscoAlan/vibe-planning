const base = require("./packages/config/eslint-config/base.js");

/** Root ESLint flat config — apps/packages extend this via their own eslint.config.js. */
module.exports = [
  ...base,
  {
    ignores: ["apps/**", "packages/database/generated/**"],
  },
];
