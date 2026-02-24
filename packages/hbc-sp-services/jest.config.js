module.exports = {
  displayName: 'sp-services',
  preset: 'ts-jest',
  testEnvironment: 'node',
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
    // Excluded: large mock/data service files (coverage via integration tests)
    '!src/services/MockDataService.ts',
    '!src/services/MockProjectService.ts',
    '!src/services/MockUserProfileService.ts',
    '!src/services/MockTelemetryService.ts',
    // Excluded: infrastructure requiring SP/Graph runtime
    '!src/services/SignalRService.ts',
    '!src/services/StandaloneSharePointDataService.ts',
    '!src/services/createDelegatingService.ts',
    '!src/services/ProjectService.ts',
    '!src/services/UserProfileService.ts',
    '!src/services/NotificationService.ts',
    '!src/services/TelemetryService.ts',
    // Excluded: mutation scaffolding (Phase 6)
    '!src/services/mutations/**',
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
      statements: 80,
      branches: 60,
      functions: 70,
      lines: 80,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: 'coverage',
};
