// eslint.config.cjs (Flat Config for ESLint v9+, .cjs extension for ESM compatibility)
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        __dirname: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        AbortController: "readonly",
        URL: "readonly",
        fetch: "readonly",
        self: "readonly",
        caches: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-empty": "off"
    }
  },
  {
    files: ["**/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly"
      }
    }
  },
  {
    files: ["api/chat.js"],
    languageOptions: {
      sourceType: "module"
    }
  }
];
