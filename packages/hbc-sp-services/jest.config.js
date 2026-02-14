const path = require('path');

module.exports = {
  displayName: 'sp-services',
  // Use the v29 jest-environment-node nested under jest (SPFx hoists v25 to root)
  testEnvironment: path.resolve(__dirname, '../../node_modules/jest/node_modules/jest-environment-node'),
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/index.ts',
    '!src/services/columnMappings.ts',
    // Excluded: SP implementation requires PnP mock chain (see plan §Out of Scope)
    '!src/services/SharePointDataService.ts',
    // Excluded: requires DOM mocks (html2canvas, jsPDF, XLSX)
    '!src/services/ExportService.ts',
    // Excluded: infrastructure services requiring external mocks
    '!src/services/GraphService.ts',
    '!src/services/HubNavigationService.ts',
    '!src/services/OfflineQueueService.ts',
    '!src/services/PowerAutomateService.ts',
    // Excluded: P2 utilities (low ROI)
    '!src/utils/breadcrumbs.ts',
    '!src/utils/formatters.ts',
    '!src/utils/riskEngine.ts',
    '!src/utils/siteDetector.ts',
    // Excluded: test helpers
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 20,
      functions: 25,
      lines: 30,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: 'coverage',
};
