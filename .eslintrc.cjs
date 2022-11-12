module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? ['warn', { allow: ['info', 'warn', 'error']}] : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'comma-dangle': ['warn', 'always-multiline'],
    'no-unused-vars': 'warn',
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'never'],
    'indent': ['warn', 2],
  },
}
