require('@rushstack/eslint-config/patch/modern-module-resolution');

const governanceRulesEnabled = process.argv.includes('--rulesdir');
const governanceRules = governanceRulesEnabled
  ? {
      'no-hardcoded-color': 'warn',
      'prefer-griffel-tokens': 'warn',
      'no-direct-tanstack-table': 'error'
    }
  : {};

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
      files: ['src/webparts/hbcProjectControls/**/*.ts', 'src/webparts/hbcProjectControls/**/*.tsx'],
      rules: {
        ...governanceRules,
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['**/shared/DataTable'],
              message: 'Use HbcDataTable from @/components/shared/HbcDataTable instead.'
            },
            {
              group: ['@tanstack/react-table'],
              message: 'Do not import @tanstack/react-table outside the tanstack/table adapter layer.'
            }
          ]
        }]
      }
    },
    {
      files: ['src/webparts/hbcProjectControls/tanstack/table/**/*.ts', 'src/webparts/hbcProjectControls/tanstack/table/**/*.tsx'],
      rules: {
        ...(governanceRulesEnabled ? { 'no-direct-tanstack-table': 'off' } : {}),
        'no-restricted-imports': 'off'
      }
    }
  ]
};
