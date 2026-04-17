import type { Config } from 'jest';

const config: Config = {
  displayName: 'infrastructure-integration',
  testMatch: ['<rootDir>/test-integration/**/*.test.ts'],
  testTimeout: 60_000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { decoratorVersion: '2022-03' },
        target: 'es2022',
      },
      module: { type: 'es6' },
    }],
  },
  // TODO: S4 removes Bun APIs from production code, then un-skip these
  testPathIgnorePatterns: [
    'test-integration/esco/',
    'test-integration/linguist/',
    'test-integration/mind/',
    'test-integration/tanova/',
  ],
  setupFilesAfterEnv: ['../test/jest-globals.ts'],
};

export default config;
