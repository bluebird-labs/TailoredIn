import { describe, expect, test } from 'bun:test';
import { ConceptDependency } from '../../src/entities/ConceptDependency.js';

describe('ConceptDependency', () => {
  test('creates with skillId and conceptId', () => {
    const dep = ConceptDependency.create({ skillId: 'skill-1', conceptId: 'concept-1' });
    expect(dep.id).toBeString();
    expect(dep.skillId).toBe('skill-1');
    expect(dep.conceptId).toBe('concept-1');
  });
});
