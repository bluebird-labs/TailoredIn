import { describe, expect, test } from 'bun:test';
import { ExperienceGenerationOverride } from '../../src/entities/ExperienceGenerationOverride.js';

describe('ExperienceGenerationOverride', () => {
  describe('create', () => {
    test('sets fields and timestamps', () => {
      const override = ExperienceGenerationOverride.create({
        experienceId: 'exp-1',
        bulletMin: 3,
        bulletMax: 6
      });

      expect(override.experienceId).toBe('exp-1');
      expect(override.bulletMin).toBe(3);
      expect(override.bulletMax).toBe(6);
      expect(override.id).toBeDefined();
      expect(override.createdAt).toBeInstanceOf(Date);
      expect(override.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateBulletRange', () => {
    test('updates min and max', () => {
      const override = ExperienceGenerationOverride.create({
        experienceId: 'exp-1',
        bulletMin: 2,
        bulletMax: 5
      });

      override.updateBulletRange(4, 8);

      expect(override.bulletMin).toBe(4);
      expect(override.bulletMax).toBe(8);
    });

    test('updates timestamp', () => {
      const override = new ExperienceGenerationOverride({
        id: crypto.randomUUID(),
        experienceId: 'exp-1',
        bulletMin: 2,
        bulletMax: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      });

      override.updateBulletRange(3, 7);

      expect(override.updatedAt.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
    });

    test('throws when min is 0', () => {
      const override = ExperienceGenerationOverride.create({
        experienceId: 'exp-1',
        bulletMin: 2,
        bulletMax: 5
      });

      expect(() => override.updateBulletRange(0, 5)).toThrow('bulletMin must be greater than 0');
    });

    test('throws when max is less than min', () => {
      const override = ExperienceGenerationOverride.create({
        experienceId: 'exp-1',
        bulletMin: 2,
        bulletMax: 5
      });

      expect(() => override.updateBulletRange(5, 3)).toThrow('bulletMax must be greater than or equal to bulletMin');
    });

    test('allows min equal to max', () => {
      const override = ExperienceGenerationOverride.create({
        experienceId: 'exp-1',
        bulletMin: 2,
        bulletMax: 5
      });

      override.updateBulletRange(3, 3);

      expect(override.bulletMin).toBe(3);
      expect(override.bulletMax).toBe(3);
    });
  });
});
