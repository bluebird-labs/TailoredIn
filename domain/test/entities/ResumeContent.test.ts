import { describe, expect, test } from 'bun:test';
import { ResumeContent } from '../../src/entities/ResumeContent.js';
import { ResumeContentId } from '../../src/value-objects/ResumeContentId.js';

function makeResumeContent() {
  return new ResumeContent({
    id: new ResumeContentId('rc-1'),
    profileId: 'profile-1',
    jobDescriptionId: 'jd-1',
    headline: 'Senior Engineer',
    experiences: [
      { experienceId: 'exp-1', summary: 'Built systems', bullets: ['A', 'B', 'C'], displayedBulletCount: null },
      { experienceId: 'exp-2', summary: 'Led teams', bullets: ['D', 'E'], displayedBulletCount: null }
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
      experiences: [{ experienceId: 'e1', summary: '', bullets: ['x'], displayedBulletCount: null }],
      prompt: 'p',
      schema: null
    });
    expect(rc.hiddenEducationIds).toEqual([]);
  });

  describe('withExperienceBulletCount', () => {
    test('returns a new instance with updated count', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceBulletCount('exp-1', 2);

      expect(updated).not.toBe(original);
      expect(updated.experiences[0].displayedBulletCount).toBe(2);
      expect(updated.experiences[1].displayedBulletCount).toBeNull();
    });

    test('preserves original instance unchanged', () => {
      const original = makeResumeContent();
      original.withExperienceBulletCount('exp-1', 1);

      expect(original.experiences[0].displayedBulletCount).toBeNull();
    });

    test('preserves same id', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceBulletCount('exp-1', 2);

      expect(updated.id.value).toBe(original.id.value);
    });

    test('refreshes updatedAt', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceBulletCount('exp-1', 2);

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
    });

    test('can reset to null (show all)', () => {
      const original = makeResumeContent().withExperienceBulletCount('exp-1', 2);
      const reset = original.withExperienceBulletCount('exp-1', null);

      expect(reset.experiences[0].displayedBulletCount).toBeNull();
    });

    test('leaves unmatched experiences unchanged', () => {
      const original = makeResumeContent();
      const updated = original.withExperienceBulletCount('nonexistent', 5);

      expect(updated.experiences[0].displayedBulletCount).toBeNull();
      expect(updated.experiences[1].displayedBulletCount).toBeNull();
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

      expect(updated.id.value).toBe(original.id.value);
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
