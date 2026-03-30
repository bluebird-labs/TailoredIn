import { describe, expect, test } from 'bun:test';
import { ResumeLocation } from '../../src/value-objects/ResumeLocation.js';

describe('ResumeLocation', () => {
  test('stores label and ordinal', () => {
    const loc = new ResumeLocation('New York, NY', 0);
    expect(loc.label).toBe('New York, NY');
    expect(loc.ordinal).toBe(0);
  });

  test('equals returns true for identical props', () => {
    const a = new ResumeLocation('Paris, France', 1);
    const b = new ResumeLocation('Paris, France', 1);
    expect(a.equals(b)).toBe(true);
  });

  test('equals returns false for different label', () => {
    const a = new ResumeLocation('Paris, France', 0);
    const b = new ResumeLocation('London, UK', 0);
    expect(a.equals(b)).toBe(false);
  });

  test('equals returns false for different ordinal', () => {
    const a = new ResumeLocation('Paris, France', 0);
    const b = new ResumeLocation('Paris, France', 1);
    expect(a.equals(b)).toBe(false);
  });
});
