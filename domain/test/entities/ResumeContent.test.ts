import { ResumeContent } from '../../src/entities/ResumeContent.js';

function makeResumeContent() {
  return new ResumeContent({
    id: 'rc-1',
    profileId: 'profile-1',
    jobDescriptionId: 'jd-1',
    headline: 'Senior Engineer',
    experiences: [
      { experienceId: 'exp-1', summary: 'Built systems', bullets: ['A', 'B', 'C'], hiddenBulletIndices: [] },
      { experienceId: 'exp-2', summary: 'Led teams', bullets: ['D', 'E'], hiddenBulletIndices: [] }
    ],
    hiddenEducationIds: [],
    prompt: 'test',
    schema: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

describe('ResumeContent', () => {
  test('create sets defaults for hiddenEducationIds', () => {
    const rc = ResumeContent.create({
      profileId: 'p1',
      jobDescriptionId: 'jd1',
      headline: 'Test',
      experiences: [{ experienceId: 'e1', summary: '', bullets: ['x'], hiddenBulletIndices: [] }],
      prompt: 'p',
      schema: null
    });
    expect(rc.hiddenEducationIds).toEqual([]);
  });

  describe('withExperienceHiddenBullets', () => {
    test('returns a new instance with updated hidden indices', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceHiddenBullets('exp-1', [1, 2]);

      expect(updated).not.toBe(original);
      expect(updated.experiences[0].hiddenBulletIndices).toEqual([1, 2]);
      expect(updated.experiences[1].hiddenBulletIndices).toEqual([]);
    });

    test('preserves original instance unchanged', () => {
      const original = makeResumeContent();
      original.withExperienceHiddenBullets('exp-1', [0]);

      expect(original.experiences[0].hiddenBulletIndices).toEqual([]);
    });

    test('preserves same id', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceHiddenBullets('exp-1', [1]);

      expect(updated.id).toBe(original.id);
    });

    test('refreshes updatedAt', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceHiddenBullets('exp-1', [0]);

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });

    test('can reset to empty (show all)', () => {
      const original = makeResumeContent().withExperienceHiddenBullets('exp-1', [1, 2]);
      const reset = original.withExperienceHiddenBullets('exp-1', []);

      expect(reset.experiences[0].hiddenBulletIndices).toEqual([]);
    });

    test('leaves unmatched experiences unchanged', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceHiddenBullets('nonexistent', [0]);

      expect(updated.experiences[0].hiddenBulletIndices).toEqual([]);
      expect(updated.experiences[1].hiddenBulletIndices).toEqual([]);
    });
  });

  describe('withHiddenEducationIds', () => {
    test('returns a new instance with updated hidden IDs', () => {
      const original = makeResumeContent();
      const updated = original.withHiddenEducationIds(['edu-1', 'edu-2']);

      expect(updated).not.toBe(original);
      expect(updated.hiddenEducationIds).toEqual(['edu-1', 'edu-2']);
    });

    test('preserves original instance unchanged', () => {
      const original = makeResumeContent();
      original.withHiddenEducationIds(['edu-1']);

      expect(original.hiddenEducationIds).toEqual([]);
    });

    test('preserves same id', () => {
      const original = makeResumeContent();
      const updated = original.withHiddenEducationIds(['edu-1']);

      expect(updated.id).toBe(original.id);
    });

    test('refreshes updatedAt', () => {
      const original = makeResumeContent();
      const updated = original.withHiddenEducationIds(['edu-1']);

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });

    test('can reset to empty', () => {
      const original = makeResumeContent().withHiddenEducationIds(['edu-1']);
      const reset = original.withHiddenEducationIds([]);

      expect(reset.hiddenEducationIds).toEqual([]);
    });
  });
});
