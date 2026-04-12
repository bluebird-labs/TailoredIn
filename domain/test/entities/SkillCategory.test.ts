import { describe, expect, test } from 'bun:test';
import { SkillCategory } from '../../src/entities/SkillCategory.js';

describe('SkillCategory', () => {
  test('creates with required fields', () => {
    const cat = SkillCategory.create({ label: 'Programming Languages', ordinal: 1 });
    expect(cat.id).toBeString();
    expect(cat.label).toBe('Programming Languages');
    expect(cat.normalizedLabel).toBe('programminglanguages');
    expect(cat.ordinal).toBe(1);
    expect(cat.createdAt).toBeInstanceOf(Date);
    expect(cat.updatedAt).toBeInstanceOf(Date);
  });

  test('derives normalizedLabel from label', () => {
    const cat = SkillCategory.create({ label: 'AI & Machine Learning', ordinal: 7 });
    expect(cat.normalizedLabel).toBe('ai&machinelearning');
  });

  test('throws when label is empty', () => {
    expect(() => SkillCategory.create({ label: '', ordinal: 0 })).toThrow('label');
  });

  test('throws when label exceeds 500 chars', () => {
    expect(() => SkillCategory.create({ label: 'a'.repeat(501), ordinal: 0 })).toThrow('label');
  });

  test('throws when ordinal is negative', () => {
    expect(() => SkillCategory.create({ label: 'Valid', ordinal: -1 })).toThrow('ordinal');
  });

  test('allows ordinal of zero', () => {
    const cat = SkillCategory.create({ label: 'Valid', ordinal: 0 });
    expect(cat.ordinal).toBe(0);
  });
});
