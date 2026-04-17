import type { Config } from 'jest';

const config: Config = {
  displayName: 'infrastructure',
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
  // TODO: S4 removes Bun APIs from production code, then un-skip these
  testPathIgnorePatterns: [
    'test/auth/BunPasswordHasher\\.test\\.ts',
    'test/auth/JwtTokenIssuer\\.test\\.ts',
    'test/company/ClaudeApiCompanyDataProvider\\.test\\.ts',
    'test/esco/EscoCsvParser\\.test\\.ts',
    'test/esco/EscoDatasetParser\\.test\\.ts',
    'test/job/ClaudeApiJobDescriptionParser\\.test\\.ts',
    'test/linguist/LinguistParser\\.test\\.ts',
    'test/llm/BaseLlmApiProvider\\.test\\.ts',
    'test/llm/ClaudeApiProvider\\.test\\.ts',
    'test/mind/MindDatasetParser\\.test\\.ts',
    'test/resume/TypstResumeRendererFactory\\.test\\.ts',
    'test/tanova/TanovaDatasetParser\\.test\\.ts',
  ],
  setupFilesAfterEnv: ['../test/jest-globals.ts'],
};

export default config;
