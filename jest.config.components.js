module.exports = {
  displayName: 'components',
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
      isolatedModules: true,
    }],
  },
  moduleNameMapper: {
    // Path aliases from tsconfig.json
    '^@components/(.*)$': '<rootDir>/src/webparts/hbcProjectControls/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/webparts/hbcProjectControls/components/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/webparts/hbcProjectControls/components/contexts/$1',
    '^@theme/(.*)$': '<rootDir>/src/webparts/hbcProjectControls/theme/$1',
    '^@router$': '<rootDir>/src/webparts/hbcProjectControls/router/index.tsx',
    '^@router/(.*)$': '<rootDir>/src/webparts/hbcProjectControls/router/$1',
    // Map @hbc/sp-services to source TS (not compiled lib)
    '^@hbc/sp-services$': '<rootDir>/packages/hbc-sp-services/src/index.ts',
    // Stub CSS/SCSS modules
    '\\.(css|scss|sass|less)$': '<rootDir>/src/__mocks__/styleMock.js',
    // ECharts mocks — prevent canvas/DOM issues in jsdom
    '^echarts-for-react$': '<rootDir>/src/__mocks__/echarts-for-react.tsx',
    '^echarts/core$': '<rootDir>/src/__mocks__/echarts__core.ts',
    '^echarts/(.*)$': '<rootDir>/src/__mocks__/echarts__core.ts',
    '^echarts$': '<rootDir>/src/__mocks__/echarts__core.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/webparts/hbcProjectControls/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
    // Exclude lazy route wrappers (thin re-exports, tested via E2E)
    '!src/webparts/hbcProjectControls/tanstack/router/lazy/**',
  ],
  coverageThreshold: {
    global: {
      statements: 9,
      branches: 5,
      functions: 6,
      lines: 10,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: 'coverage',
};
