import type { Config } from 'jest';

const config: Config = {
  displayName: 'application',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2022'
        },
        module: { type: 'es6' }
      }
    ]
  },
  setupFiles: ['./test/setup.ts'],
  setupFilesAfterEnv: ['../test/jest-globals.ts']
};

export default config;
