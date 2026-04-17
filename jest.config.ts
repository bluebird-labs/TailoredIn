import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/core',
    '<rootDir>/domain',
    '<rootDir>/application',
    '<rootDir>/infrastructure',
    '<rootDir>/web',
  ],
};

export default config;
