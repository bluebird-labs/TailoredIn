import type { Config } from 'jest';

const config: Config = {
  displayName: 'web',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true, decorators: true },
          transform: { decoratorVersion: '2022-03', react: { runtime: 'automatic' } },
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
