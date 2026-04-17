import { GenerationScope, GenerationSettings, type GenerationSettingsRepository, ModelTier } from '@tailoredin/domain';
import { GetGenerationSettings } from '../../../src/use-cases/generation-settings/GetGenerationSettings.js';

function makeSettings(profileId = 'profile-1'): GenerationSettings {
  const settings = GenerationSettings.createDefault(profileId);
  settings.setPrompt(GenerationScope.RESUME, 'Use past tense');
  return settings;
}

function mockRepo(settings: GenerationSettings | null): GenerationSettingsRepository {
  return {
    findByProfileId: jest.fn(() => Promise.resolve(settings)),
    save: jest.fn(() => Promise.resolve())
  };
}

describe('GetGenerationSettings', () => {
  test('returns existing settings as DTO', async () => {
    const settings = makeSettings();
    const repo = mockRepo(settings);
    const useCase = new GetGenerationSettings(repo);

    const result = await useCase.execute({ profileId: 'profile-1' });

    expect(result.profileId).toBe('profile-1');
    expect(result.modelTier).toBe(ModelTier.BALANCED);
    expect(result.bulletMin).toBe(2);
    expect(result.bulletMax).toBe(5);
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0].scope).toBe(GenerationScope.RESUME);
    expect(repo.save).not.toHaveBeenCalled();
  });

  test('creates default settings when none exist and saves them', async () => {
    const repo = mockRepo(null);
    const useCase = new GetGenerationSettings(repo);

    const result = await useCase.execute({ profileId: 'profile-1' });

    expect(result.profileId).toBe('profile-1');
    expect(result.modelTier).toBe(ModelTier.BALANCED);
    expect(result.bulletMin).toBe(2);
    expect(result.bulletMax).toBe(5);
    expect(result.prompts).toEqual([]);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
