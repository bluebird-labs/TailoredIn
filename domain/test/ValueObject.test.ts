import { describe, expect, test } from 'bun:test';
import { ExperienceId } from '../src/value-objects/ExperienceId.js';
import { HeadlineId } from '../src/value-objects/HeadlineId.js';
import { SalaryRange } from '../src/value-objects/SalaryRange.js';

describe('ValueObject', () => {
  describe('equals', () => {
    test('equal when same type and same props', () => {
      const a = new ExperienceId('abc');
      const b = new ExperienceId('abc');
      expect(a.equals(b)).toBe(true);
    });

    test('not equal when same type but different props', () => {
      const a = new ExperienceId('abc');
      const b = new ExperienceId('xyz');
      expect(a.equals(b)).toBe(false);
    });

    test('not equal when different types with same value', () => {
      const expId = new ExperienceId('abc');
      const headlineId = new HeadlineId('abc');
      // biome-ignore lint/suspicious/noExplicitAny: testing cross-type equality
      expect(expId.equals(headlineId as any)).toBe(false);
    });

    test('not equal to null or undefined', () => {
      const id = new ExperienceId('abc');
      // biome-ignore lint/suspicious/noExplicitAny: testing null safety
      expect(id.equals(null as any)).toBe(false);
      // biome-ignore lint/suspicious/noExplicitAny: testing undefined safety
      expect(id.equals(undefined as any)).toBe(false);
    });

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

  describe('generate', () => {
    test('generates unique IDs', () => {
      const a = ExperienceId.generate();
      const b = ExperienceId.generate();
      expect(a.value).not.toBe(b.value);
    });
  });
});
