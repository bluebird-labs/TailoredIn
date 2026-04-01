import { describe, expect, test } from 'bun:test';
import { TagProfile } from '../../src/value-objects/TagProfile.js';

describe('TagProfile', () => {
  test('creates with weighted tags', () => {
    const profile = new TagProfile({
      roleWeights: new Map([['leadership', 0.8], ['architecture', 0.6]]),
      skillWeights: new Map([['typescript', 0.9], ['system-design', 0.7]]),
    });
    expect(profile.roleWeights.get('leadership')).toBe(0.8);
    expect(profile.skillWeights.get('typescript')).toBe(0.9);
  });

  test('overlap computes dot product', () => {
    const archetype = new TagProfile({
      roleWeights: new Map([['leadership', 0.8], ['ic', 0.2]]),
      skillWeights: new Map([['typescript', 0.9]]),
    });
    const job = new TagProfile({
      roleWeights: new Map([['leadership', 1.0]]),
      skillWeights: new Map([['typescript', 1.0], ['react', 0.5]]),
    });
    const score = archetype.overlapWith(job);
    // role: leadership 0.8*1.0 = 0.8, ic 0.2*0 = 0
    // skill: typescript 0.9*1.0 = 0.9, react 0*0.5 = 0
    // total = 1.7
    expect(score).toBeCloseTo(1.7, 5);
  });

  test('empty profile', () => {
    const empty = TagProfile.empty();
    expect(empty.roleWeights.size).toBe(0);
    expect(empty.skillWeights.size).toBe(0);
  });
});
