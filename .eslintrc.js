module.exports = {
  // When adding items to this file please check for effects on sub-directories.
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: "module",
  },
  env: {
    node: true,
    browser: true,
  },
  plugins: ["prettier", "import", "react", "react-hooks", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
    "plugin:prettier/recommended",
  ],
  rules: {
    "no-empty": ["error", { allowEmptyCatch: true }],
    "no-unused-vars": 0,
    "@typescript-eslint/no-unused-vars": 2,
    "prettier/prettier": ["error", {}, { usePrettierrc: true }],
    // Why no react/jsx-no-bind?
    // See: https://twitter.com/Meligy/status/1069074157151780864
    //      https://reactjs.org/docs/hooks-faq.html#are-hooks-slow-because-of-creating-functions-in-render
    //      https://cdb.reacttraining.com/react-inline-functions-and-performance-bdff784f5578

    "react/prop-types": 0,
    // TODO: Remove no-deprecated when finished migrating
    "react/no-deprecated": 0,
    "react/jsx-no-target-blank": 2,
    "react/jsx-no-undef": 2,
    "react/jsx-pascal-case": 2,
    "react/no-access-state-in-setstate": 2,
    "react/no-danger": 2,
    "react/no-did-mount-set-state": 2,
    "react/no-did-update-set-state": 2,
    "react/no-direct-mutation-state": 2,
    "react/no-unknown-property": 0,

    "react-hooks/rules-of-hooks": 2,
    "react-hooks/exhaustive-deps": 1,
  },
  globals: {
    globalThis: false,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
