require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: ['@microsoft/eslint-config-spfx/lib/profiles/react'],
  parserOptions: { tsconfigRootDir: __dirname },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.eslint.json',
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
    },
    {
      files: ['packages/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'prefer-const': 'off'
      }
    },
    {
      files: ['src/webparts/hbcProjectControls/components/**/*.ts', 'src/webparts/hbcProjectControls/components/**/*.tsx'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [{
            group: ['**/shared/DataTable'],
            message: 'DataTable is removed. Use HbcTanStackTable from tanstack/table.'
          }]
        }]
      }
    }
  ]
};
