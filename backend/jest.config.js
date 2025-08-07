module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.ts'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};