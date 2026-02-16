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
    // Map @hbc/sp-services to source TS (not compiled lib)
    '^@hbc/sp-services$': '<rootDir>/packages/hbc-sp-services/src/index.ts',
    // Stub CSS/SCSS modules
    '\\.(css|scss|sass|less)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
