import { describe, expect, test } from 'bun:test';
import { StringUtil } from '../src/StringUtil.js';

describe('StringUtil', () => {
  describe('ensureEndsWith', () => {
    test('appends char if missing', () => {
      expect(StringUtil.ensureEndsWith('hello', '/')).toBe('hello/');
    });

    test('does not double-append if already present', () => {
      expect(StringUtil.ensureEndsWith('hello/', '/')).toBe('hello/');
    });

    test('handles empty string', () => {
      expect(StringUtil.ensureEndsWith('', '/')).toBe('/');
    });
  });

  describe('toKebabCase', () => {
    test('converts camelCase', () => {
      expect(StringUtil.toKebabCase('myVariableName')).toBe('my-variable-name');
    });

    test('converts PascalCase', () => {
      expect(StringUtil.toKebabCase('MyClassName')).toBe('my-class-name');
    });

    test('converts spaces', () => {
      expect(StringUtil.toKebabCase('hello world')).toBe('hello-world');
    });

    test('handles consecutive non-alphanumeric chars', () => {
      expect(StringUtil.toKebabCase('hello--world')).toBe('hello-world');
    });

    test('strips leading/trailing hyphens', () => {
      expect(StringUtil.toKebabCase('-hello-')).toBe('hello');
    });
  });

  describe('toLowerSnakeCase', () => {
    test('converts spaces to underscores', () => {
      expect(StringUtil.toLowerSnakeCase('hello world')).toBe('hello_world');
    });

    test('lowercases and converts hyphens', () => {
      expect(StringUtil.toLowerSnakeCase('My-Variable')).toBe('my_variable');
    });

    test('collapses consecutive underscores', () => {
      expect(StringUtil.toLowerSnakeCase('hello__world')).toBe('hello_world');
    });

    test('strips leading/trailing underscores', () => {
      expect(StringUtil.toLowerSnakeCase('_hello_')).toBe('hello');
    });
  });
});
