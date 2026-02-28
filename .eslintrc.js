'use strict';

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    // Catch common bugs
    'no-unused-vars': 'error',
    'no-undef': 'error',
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',

    // Code quality
    'no-var': 'error',
    'prefer-const': 'error',
    'curly': ['error', 'all'],

    // Style consistency
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
  },
};
