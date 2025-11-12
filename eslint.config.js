// ESLint flat config to make linting behave with current ESLint version
module.exports = [
  // Ignore common build/test/artifacts
  {
    ignores: ["node_modules/**", "uploads/**", "coverage/**"]
  },

  // Default rules for JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
    },
    settings: {
      react: { version: "detect" }
    },
    rules: {
      // Temporarily relax no-undef (project contains CommonJS and test globals)
      "no-undef": "off"
    }
  },

  // Tests: enable jest globals
  {
    files: ["**/*.test.js", "jest.setup.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script"
    },
    rules: {},
    // jest globals will be available to tests via `globals` if needed
  }
];
