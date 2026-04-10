import { describe, expect, test } from 'bun:test';
import { SalaryRange } from '../src/value-objects/SalaryRange.js';

describe('ValueObject', () => {
  describe('equals', () => {
    test('works with multi-property value objects', () => {
      const a = new SalaryRange({ min: 100000, max: 150000, currency: 'USD' });
      const b = new SalaryRange({ min: 100000, max: 150000, currency: 'USD' });
      const c = new SalaryRange({ min: 100000, max: 200000, currency: 'USD' });
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });

    test('handles null property values correctly', () => {
      const a = new SalaryRange({ min: null, max: null, currency: 'USD' });
      const b = new SalaryRange({ min: null, max: null, currency: 'USD' });
      expect(a.equals(b)).toBe(true);
    });
  });
});
