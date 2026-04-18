import { SkillCategory } from '../../src/entities/SkillCategory.js';

describe('SkillCategory', () => {
  test('creates with required fields', () => {
    const cat = SkillCategory.create({ label: 'Programming Languages' });
    expect(typeof cat.id).toBe('string');
    expect(cat.label).toBe('Programming Languages');
    expect(cat.normalizedLabel).toBe('programming-languages');
    expect(cat.createdAt).toBeInstanceOf(Date);
    expect(cat.updatedAt).toBeInstanceOf(Date);
  });

  test('derives normalizedLabel from label', () => {
    const cat = SkillCategory.create({ label: 'AI & Machine Learning' });
    expect(cat.normalizedLabel).toBe('ai-machine-learning');
  });

  test('throws when label is empty', () => {
    expect(() => SkillCategory.create({ label: '' })).toThrow('label');
  });

  test('throws when label exceeds 500 chars', () => {
    expect(() => SkillCategory.create({ label: 'a'.repeat(501) })).toThrow('label');
  });
});
