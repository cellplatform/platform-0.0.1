module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    jsx: true,
    useJSXTextNode: true,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-console': 2,
    'arrow-parens': ['error', 'always'],
    'react/prop-types': 0,
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      { classes: false, functions: false, variables: false },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'none', ignoreRestSiblings: true },
    ],

    // https://reactjs.org/docs/hooks-rules.html#eslint-plugin
    'react-hooks/rules-of-hooks': 'error', // Check rules of Hooks
    'react-hooks/exhaustive-deps': 'warn', // Check effect dependencies
  },
};
