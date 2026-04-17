import { ExperienceSkill } from '../../src/entities/ExperienceSkill.js';

describe('ExperienceSkill', () => {
  test('creates with required fields', () => {
    const es = ExperienceSkill.create({ experienceId: 'exp-1', skillId: 'skill-1' });
    expect(typeof es.id).toBe('string');
    expect(es.experienceId).toBe('exp-1');
    expect(es.skillId).toBe('skill-1');
    expect(es.createdAt).toBeInstanceOf(Date);
  });

  test('generates unique IDs', () => {
    const a = ExperienceSkill.create({ experienceId: 'exp-1', skillId: 'skill-1' });
    const b = ExperienceSkill.create({ experienceId: 'exp-1', skillId: 'skill-2' });
    expect(a.id).not.toBe(b.id);
  });
});
