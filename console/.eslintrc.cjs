/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,

  env: {
    "vue/setup-compiler-macros": true
  },

  extends: [
    "plugin:vue/recommended",
    "eslint:recommended",
    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier"
  ],

  rules: {
    curly: ["error", "all"],
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "prefer-const": [
      "error",
      {
        destructuring: "any",
        ignoreReadBeforeAssign: false
      }
    ],
    "no-use-before-define": "error",
    eqeqeq: "error",
    "require-await": "error",
    "no-useless-rename": "error",
    "vue/no-v-html": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        format: ["camelCase", "snake_case", "PascalCase", "UPPER_CASE"],
        selector: "default"
      }
    ]
  }
};
