import { describe, expect, test } from 'bun:test';
import { Concept } from '../../src/entities/Concept.js';
import { ConceptKind } from '../../src/value-objects/ConceptKind.js';

describe('Concept', () => {
  test('creates with required fields', () => {
    const concept = Concept.create({
      label: 'REST (Representational State Transfer)',
      kind: ConceptKind.ARCHITECTURAL_PATTERN,
      category: 'Service Architecture Patterns',
      mindName: 'REST (Representational State Transfer)'
    });
    expect(concept.id).toBeString();
    expect(concept.label).toBe('REST (Representational State Transfer)');
    expect(concept.normalizedLabel).toBe('rest-representational-state-transfer');
    expect(concept.kind).toBe(ConceptKind.ARCHITECTURAL_PATTERN);
    expect(concept.category).toBe('Service Architecture Patterns');
    expect(concept.mindName).toBe('REST (Representational State Transfer)');
  });

  test('creates with null category', () => {
    const concept = Concept.create({
      label: 'Object-Oriented',
      kind: ConceptKind.CONCEPTUAL_ASPECT,
      category: null,
      mindName: 'Object-Oriented'
    });
    expect(concept.category).toBeNull();
  });

  test('throws when label is empty', () => {
    expect(() =>
      Concept.create({ label: '', kind: ConceptKind.TECHNICAL_DOMAIN, category: null, mindName: null })
    ).toThrow('label');
  });
});
