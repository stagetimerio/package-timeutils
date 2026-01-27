import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? ['warn', { allow: ['info', 'warn', 'error']}] : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'comma-dangle': ['warn', 'always-multiline'],
      'quotes': ['warn', 'single'],
      'semi': ['warn', 'never'],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'space-before-function-paren': ['warn', 'always'],
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // Global ignore patterns
  {
    ignores: [
      'dist/',
    ],
  },
)
