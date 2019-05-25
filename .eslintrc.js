module.exports = {
  // When adding items to this file please check for effects on sub-directories.
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    sourceType: "module"
  },
  env: {
    node: true
  },
  plugins: [
    "import", // require("eslint-plugin-import")
    "react" // require("eslint-plugin-react")
  ],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:mozilla/recommended", // require("eslint-plugin-mozilla")
    "prettier"
  ],
  rules: {
    // Why no react/jsx-no-bind?
    // See: https://twitter.com/Meligy/status/1069074157151780864
    //      https://reactjs.org/docs/hooks-faq.html#are-hooks-slow-because-of-creating-functions-in-render
    //      https://cdb.reacttraining.com/react-inline-functions-and-performance-bdff784f5578

    "react/prop-types": 0,
    // TODO: Remove when finished migrating
    "react/no-deprecated": 0,
    "react/jsx-no-target-blank": 2,
    "react/jsx-no-undef": 2,
    "react/jsx-pascal-case": 2,
    "react/no-access-state-in-setstate": 2,
    "react/no-danger": 2,
    "react/no-did-mount-set-state": 2,
    "react/no-did-update-set-state": 2,
    "react/no-direct-mutation-state": 2,
  }
};
