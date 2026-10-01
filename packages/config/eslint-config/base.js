// @ts-check
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const globals = require("globals");

/** Base ESLint flat config shared by every app/package in the monorepo. */
module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", ".next/**", ".turbo/**", "coverage/**", "node_modules/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Node-authored config files (this monorepo's *.config.js, packages/config/**) use CommonJS.
    files: ["**/*.config.js", "**/*.config.cjs", "packages/config/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
