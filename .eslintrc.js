module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-base',
    "plugin:@typescript-eslint/recommended",
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'prettier'
  ],
  parserOptions: {
    'ecmaVersion': 2021,
    'sourceType': 'module'
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/explicit-member-accessibility': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-parameter-properties': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-explicit-any': 'off',
    'import/extensions': 'never',
  },
};