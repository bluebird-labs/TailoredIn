import { env, envBool, envInt, envOptional } from '../src/Environment.js';

describe('Environment', () => {
  const TestKey = '__TAILOREDIN_TEST_ENV_VAR__';

  beforeEach(() => {
    delete process.env[TestKey];
  });

  afterEach(() => {
    delete process.env[TestKey];
  });

  describe('env', () => {
    test('returns value when set', () => {
      process.env[TestKey] = 'hello';
      expect(env(TestKey)).toBe('hello');
    });

    test('throws when missing', () => {
      expect(() => env(TestKey)).toThrow(`Missing required environment variable: ${TestKey}`);
    });
  });

  describe('envInt', () => {
    test('parses integer', () => {
      process.env[TestKey] = '42';
      expect(envInt(TestKey)).toBe(42);
    });

    test('throws on non-integer', () => {
      process.env[TestKey] = 'abc';
      expect(() => envInt(TestKey)).toThrow('must be an integer');
    });

    test('throws when missing', () => {
      expect(() => envInt(TestKey)).toThrow('Missing required');
    });
  });

  describe('envOptional', () => {
    test('returns value when set', () => {
      process.env[TestKey] = 'value';
      expect(envOptional(TestKey)).toBe('value');
    });

    test('returns undefined when missing', () => {
      expect(envOptional(TestKey)).toBeUndefined();
    });
  });

  describe('envBool', () => {
    test('returns true for "true"', () => {
      process.env[TestKey] = 'true';
      expect(envBool(TestKey)).toBe(true);
    });

    test('returns false for other values', () => {
      process.env[TestKey] = 'false';
      expect(envBool(TestKey)).toBe(false);
    });
  });
});
