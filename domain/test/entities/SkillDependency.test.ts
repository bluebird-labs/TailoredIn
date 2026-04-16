import { describe, expect, test } from 'bun:test';
import { SkillDependency } from '../../src/entities/SkillDependency.js';

describe('SkillDependency', () => {
  test('creates with skillId and impliedSkillId', () => {
    const dep = SkillDependency.create({ skillId: 'skill-1', impliedSkillId: 'skill-2' });
    expect(dep.id).toBeString();
    expect(dep.skillId).toBe('skill-1');
    expect(dep.impliedSkillId).toBe('skill-2');
  });
});
