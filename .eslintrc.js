module.exports = {
  extends: [
    'eslint-config-ns',
    // add typescript specific linting rules and add prettier typescript support
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    // set code formatting to warn level in order to better distinguish it in the IDE from "real" errors
    'prettier/prettier': 1,
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/no-use-before-define': 0,
    // allow to use _ as prefix for unused arguments to functions, in order to implement interfaces
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    'import/extensions': 0,
    'import/no-named-as-default': 0,
    'import/order': 0,
    'lines-between-class-members': 0,
    'jest/prefer-strict-equal': 'error',
    'no-use-before-define': 0,
    'react/prop-types': 0,
    'react/forbid-prop-types': 0,
    'react/require-default-props': 0,
    'react/jsx-props-no-spreading': 0,
    'sort-keys': 0,
    'class-methods-use-this': 0,
    // this check somehow does not recognize list additions
    'no-unused-expressions': 0,
    // allow ForOfStatement, which is not allowed by airbnb preset
    "no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
    'react/destructuring-assignment': 0,
  },
  overrides: [
    {
      files: ['jest.setup.js', '*.test.js'],
      globals: {
        jsdom: true,
        page: true,
      },
      rules: {
        'jsx-a11y/alt-text': 0,
        'no-console': 0,
        'react/prop-types': 0,
      },
    },
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
}
