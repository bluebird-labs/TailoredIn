import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/libs/core',
    '<rootDir>/libs/domain',
    '<rootDir>/libs/application',
    '<rootDir>/libs/infrastructure',
    '<rootDir>/apps/web',
  ],
};

export default config;
