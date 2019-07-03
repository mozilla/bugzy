module.exports = {
  // When adding items to this file please check for effects on sub-directories.
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: "module",
  },
  env: {
    node: true,
  },
  plugins: [
    "prettier", // "require("eslint-plugin-prettier")
    "import", // require("eslint-plugin-import")
    "react", // require("eslint-plugin-react")
    "react-hooks", // require("eslint-plugin-react-hooks")
    "@typescript-eslint",
  ],
  extends: [
    "plugin:mozilla/recommended", // require("eslint-plugin-mozilla")
    "plugin:react/recommended",
    "prettier",
    "prettier/react", // require("eslint-plugin-prettier)
    "prettier/@typescript-eslint", // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always
  ],
  rules: {
    "no-unused-vars": 0,
    "@typescript-eslint/no-unused-vars": 2,
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

    "react-hooks/rules-of-hooks": 2,
    "react-hooks/exhaustive-deps": 1,
  },
};
