/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/services/ProvisioningSaga.ts',
    'src/services/GraphBatchEnforcer.ts',
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 60,
  },
  timeoutMS: 60000,
  concurrency: 2,
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html',
  },
};
