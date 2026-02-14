require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: ['@microsoft/eslint-config-spfx/lib/profiles/react'],
  parserOptions: { tsconfigRootDir: __dirname },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true }
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        'react/display-name': 'off',
        'no-console': 'off'
      }
    }
  ]
};
