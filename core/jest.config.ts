import type { Config } from 'jest';

const config: Config = {
  displayName: 'core',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
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
  setupFilesAfterEnv: ['../test/jest-globals.ts'],
};

export default config;
