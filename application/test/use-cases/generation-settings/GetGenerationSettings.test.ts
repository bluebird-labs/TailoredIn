import { describe, expect, mock, test } from 'bun:test';
import {
  type ExperienceGenerationOverrideRepository,
  type ExperienceRepository,
  GenerationScope,
  GenerationSettings,
  type GenerationSettingsRepository,
  ModelTier
} from '@tailoredin/domain';
import { GetGenerationSettings } from '../../../src/use-cases/generation-settings/GetGenerationSettings.js';

function makeSettings(profileId = 'profile-1'): GenerationSettings {
  const settings = GenerationSettings.createDefault(profileId);
  settings.setPrompt(GenerationScope.RESUME, 'Use past tense');
  return settings;
}

function mockRepo(settings: GenerationSettings | null): GenerationSettingsRepository {
  return {
    findByProfileId: mock(() => Promise.resolve(settings)),
    save: mock(() => Promise.resolve())
  };
}

function mockExperienceRepo(): ExperienceRepository {
  return {
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve())
  };
}

function mockOverrideRepo(): ExperienceGenerationOverrideRepository {
  return {
    findByExperienceId: mock(() => Promise.resolve(null)),
    findByExperienceIds: mock(() => Promise.resolve([])),
    save: mock(() => Promise.resolve()),
    delete: mock(() => Promise.resolve())
  };
}

describe('GetGenerationSettings', () => {
  test('returns existing settings as DTO', async () => {
    const settings = makeSettings();
    const repo = mockRepo(settings);
    const useCase = new GetGenerationSettings(repo, mockExperienceRepo(), mockOverrideRepo());

    const result = await useCase.execute({ profileId: 'profile-1' });

    expect(result.profileId).toBe('profile-1');
    expect(result.modelTier).toBe(ModelTier.BALANCED);
    expect(result.bulletMin).toBe(2);
    expect(result.bulletMax).toBe(5);
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0].scope).toBe(GenerationScope.RESUME);
    expect(result.experienceOverrides).toEqual([]);
    expect(repo.save).not.toHaveBeenCalled();
  });

  test('creates default settings when none exist and saves them', async () => {
    const repo = mockRepo(null);
    const useCase = new GetGenerationSettings(repo, mockExperienceRepo(), mockOverrideRepo());

    const result = await useCase.execute({ profileId: 'profile-1' });

    expect(result.profileId).toBe('profile-1');
    expect(result.modelTier).toBe(ModelTier.BALANCED);
    expect(result.bulletMin).toBe(2);
    expect(result.bulletMax).toBe(5);
    expect(result.prompts).toEqual([]);
    expect(result.experienceOverrides).toEqual([]);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
