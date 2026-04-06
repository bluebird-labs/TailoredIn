import { describe, expect, test } from 'bun:test';
import { EnumUtil } from '../src/EnumUtil.js';

enum Color {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue'
}

describe('EnumUtil', () => {
  describe('is', () => {
    test('returns true for valid enum value', () => {
      expect(EnumUtil.is('red', Color)).toBe(true);
      expect(EnumUtil.is('green', Color)).toBe(true);
    });

    test('returns false for invalid enum value', () => {
      expect(EnumUtil.is('yellow', Color)).toBe(false);
      expect(EnumUtil.is('', Color)).toBe(false);
    });

    test('returns false for enum key (not value)', () => {
      expect(EnumUtil.is('RED', Color)).toBe(false);
    });
  });

  describe('values', () => {
    test('returns all enum values', () => {
      expect(EnumUtil.values(Color)).toEqual(['red', 'green', 'blue']);
    });

    test('returns empty array for empty enum-like object', () => {
      expect(EnumUtil.values({})).toEqual([]);
    });
  });
});
