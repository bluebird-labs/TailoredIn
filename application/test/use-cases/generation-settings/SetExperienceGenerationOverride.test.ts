import { describe, expect, mock, test } from 'bun:test';
import { ExperienceGenerationOverride, type ExperienceGenerationOverrideRepository } from '@tailoredin/domain';
import { SetExperienceGenerationOverride } from '../../../src/use-cases/generation-settings/SetExperienceGenerationOverride.js';

function mockRepo(existing: ExperienceGenerationOverride | null): ExperienceGenerationOverrideRepository {
  return {
    findByExperienceId: mock(() => Promise.resolve(existing)),
    findByExperienceIds: mock(() => Promise.resolve([])),
    save: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve())
  };
}

describe('SetExperienceGenerationOverride', () => {
  test('creates new override when none exists', async () => {
    const repo = mockRepo(null);
    const useCase = new SetExperienceGenerationOverride(repo);

    const result = await useCase.execute({ experienceId: 'exp-1', bulletMin: 3, bulletMax: 6 });

    expect(result.experienceId).toBe('exp-1');
    expect(result.bulletMin).toBe(3);
    expect(result.bulletMax).toBe(6);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  test('updates existing override', async () => {
    const existing = ExperienceGenerationOverride.create({
      experienceId: 'exp-1',
      bulletMin: 2,
      bulletMax: 4
    });
    const repo = mockRepo(existing);
    const useCase = new SetExperienceGenerationOverride(repo);

    const result = await useCase.execute({ experienceId: 'exp-1', bulletMin: 5, bulletMax: 10 });

    expect(result.bulletMin).toBe(5);
    expect(result.bulletMax).toBe(10);
    expect(result.id).toBe(existing.id);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
