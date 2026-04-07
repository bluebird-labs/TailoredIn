import { describe, expect, mock, test } from 'bun:test';
import type { ExperienceGenerationOverrideRepository } from '@tailoredin/domain';
import { RemoveExperienceGenerationOverride } from '../../../src/use-cases/generation-settings/RemoveExperienceGenerationOverride.js';

function mockRepo(): ExperienceGenerationOverrideRepository {
  return {
    findByExperienceId: mock(() => Promise.resolve(null)),
    findByExperienceIds: mock(() => Promise.resolve([])),
    save: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve())
  };
}

describe('RemoveExperienceGenerationOverride', () => {
  test('calls delete with the experienceId', async () => {
    const repo = mockRepo();
    const useCase = new RemoveExperienceGenerationOverride(repo);

    await useCase.execute({ experienceId: 'exp-1' });

    expect(repo.delete).toHaveBeenCalledWith('exp-1');
  });
});
