import { describe, expect, it } from 'bun:test';
import { Accomplishment } from '../../src/entities/Accomplishment.js';

describe('Accomplishment', () => {
  it('creates with required fields', () => {
    const a = Accomplishment.create({
      experienceId: 'exp-1',
      title: 'Billing sharding',
      narrative: 'Led the migration of billing engine to hash-based sharding.',
      skillTags: ['distributed-systems', 'performance'],
      ordinal: 0,
    });
    expect(a.id.value).toBeString();
    expect(a.title).toBe('Billing sharding');
    expect(a.narrative).toBe('Led the migration of billing engine to hash-based sharding.');
    expect(a.skillTags).toEqual(['distributed-systems', 'performance']);
  });

  it('updates fields', () => {
    const a = Accomplishment.create({
      experienceId: 'exp-1',
      title: 'Old',
      narrative: 'Old narrative',
      skillTags: [],
      ordinal: 0,
    });
    const before = a.updatedAt;
    a.update({ title: 'New', narrative: 'New narrative', skillTags: ['leadership'] });
    expect(a.title).toBe('New');
    expect(a.narrative).toBe('New narrative');
    expect(a.skillTags).toEqual(['leadership']);
    expect(a.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
