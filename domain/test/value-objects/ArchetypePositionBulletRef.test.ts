import { describe, expect, test } from 'bun:test';
import { ArchetypePositionBulletRef } from '../../src/value-objects/ArchetypePositionBulletRef.js';

describe('ArchetypePositionBulletRef', () => {
  test('stores bulletId and ordinal', () => {
    const ref = new ArchetypePositionBulletRef('bullet-1', 0);
    expect(ref.bulletId).toBe('bullet-1');
    expect(ref.ordinal).toBe(0);
  });

  test('equals returns true for identical props', () => {
    const a = new ArchetypePositionBulletRef('bullet-1', 0);
    const b = new ArchetypePositionBulletRef('bullet-1', 0);
    expect(a.equals(b)).toBe(true);
  });

  test('equals returns false for different bulletId', () => {
    const a = new ArchetypePositionBulletRef('bullet-1', 0);
    const b = new ArchetypePositionBulletRef('bullet-2', 0);
    expect(a.equals(b)).toBe(false);
  });
});
