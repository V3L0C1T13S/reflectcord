module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "airbnb-base",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
  ],
  rules: {
    "max-classes-per-file": "off",
    "class-methods-use-this": "off",
    "no-empty-function": "off",
    "no-unused-vars": "off",
    "import/extensions": "off",
    "import/no-unresolved": "off",
    "no-underscore-dangle": "off",
    "getter-return": "off",
    "consistent-return": "off",
    "no-useless-return": "off",
    quotes: [
      "error",
      "double",
    ],
    "lines-between-class-members": "off",
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off",
    "dot-notation": "off",
    "import/no-dynamic-require": "off",
    "global-require": "off",
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
  },
};
