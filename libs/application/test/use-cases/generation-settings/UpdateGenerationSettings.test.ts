import { GenerationScope, GenerationSettings, type GenerationSettingsRepository, ModelTier } from '@tailoredin/domain';
import { UpdateGenerationSettings } from '../../../src/use-cases/generation-settings/UpdateGenerationSettings.js';

function makeSettings(profileId = 'profile-1'): GenerationSettings {
  return GenerationSettings.createDefault(profileId);
}

function mockRepo(settings: GenerationSettings | null): GenerationSettingsRepository {
  return {
    findByProfileId: jest.fn(() => Promise.resolve(settings)),
    save: jest.fn(() => Promise.resolve())
  };
}

describe('UpdateGenerationSettings', () => {
  test('updates model tier', async () => {
    const settings = makeSettings();
    const repo = mockRepo(settings);
    const useCase = new UpdateGenerationSettings(repo);

    const result = await useCase.execute({ profileId: 'profile-1', modelTier: ModelTier.BEST });

    expect(result.modelTier).toBe(ModelTier.BEST);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  test('updates bullet range', async () => {
    const settings = makeSettings();
    const repo = mockRepo(settings);
    const useCase = new UpdateGenerationSettings(repo);

    const result = await useCase.execute({ profileId: 'profile-1', bulletMin: 3, bulletMax: 8 });

    expect(result.bulletMin).toBe(3);
    expect(result.bulletMax).toBe(8);
  });

  test('sets and removes prompts', async () => {
    const settings = makeSettings();
    const repo = mockRepo(settings);
    const useCase = new UpdateGenerationSettings(repo);

    // Set prompts
    const result1 = await useCase.execute({
      profileId: 'profile-1',
      prompts: [
        { scope: GenerationScope.RESUME, content: 'Use past tense' },
        { scope: GenerationScope.HEADLINE, content: 'Be concise' }
      ]
    });

    expect(result1.prompts).toHaveLength(2);

    // Remove one prompt
    const result2 = await useCase.execute({
      profileId: 'profile-1',
      prompts: [{ scope: GenerationScope.HEADLINE, content: null }]
    });

    expect(result2.prompts).toHaveLength(1);
    expect(result2.prompts[0].scope).toBe(GenerationScope.RESUME);
  });

  test('creates default when settings not found, then applies updates', async () => {
    const repo = mockRepo(null);
    const useCase = new UpdateGenerationSettings(repo);

    const result = await useCase.execute({ profileId: 'profile-1', modelTier: ModelTier.FAST });

    expect(result.profileId).toBe('profile-1');
    expect(result.modelTier).toBe(ModelTier.FAST);
    expect(result.bulletMin).toBe(2);
    expect(result.bulletMax).toBe(5);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  test('partial bullet range update uses existing value for the other bound', async () => {
    const settings = makeSettings();
    const repo = mockRepo(settings);
    const useCase = new UpdateGenerationSettings(repo);

    const result = await useCase.execute({ profileId: 'profile-1', bulletMax: 10 });

    expect(result.bulletMin).toBe(2);
    expect(result.bulletMax).toBe(10);
  });
});
