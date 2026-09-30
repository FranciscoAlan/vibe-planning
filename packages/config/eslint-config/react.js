// @ts-check
const base = require("./base");
const reactHooks = require("eslint-plugin-react-hooks");

/** ESLint flat config for React-based apps (web, backoffice, mobile). */
module.exports = [
  ...base,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
];
