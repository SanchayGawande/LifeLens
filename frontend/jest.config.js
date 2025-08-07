const { defaults } = require('jest-config');

module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@tamagui/.*)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
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
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test/setup.ts'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1'
  },
  testEnvironment: 'jsdom',
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  globals: {
    __DEV__: true,
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/web-build/',
    '/.expo/',
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/web-build/',
    '<rootDir>/.expo/',
  ]
};