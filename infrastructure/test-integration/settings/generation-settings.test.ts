import type { MikroORM } from '@mikro-orm/postgresql';
import { GenerationScope, GenerationSettings, ModelTier, Profile } from '@tailoredin/domain';
import { PostgresGenerationSettingsRepository } from '../../src/settings/PostgresGenerationSettingsRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

async function seedProfile(orm: MikroORM): Promise<string> {
  const profile = Profile.create({
    email: `test-${crypto.randomUUID()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    about: null,
    phone: null,
    location: null,
    linkedinUrl: null,
    githubUrl: null,
    websiteUrl: null
  });
  orm.em.persist(profile);
  await orm.em.flush();
  return profile.id;
}

describe('PostgresGenerationSettingsRepository', () => {
  let orm: MikroORM;
  let repo: PostgresGenerationSettingsRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresGenerationSettingsRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('returns null when no settings exist for profile', async () => {
    const result = await repo.findByProfileId(crypto.randomUUID());
    expect(result).toBeNull();
  });

  it('saves and retrieves generation settings with defaults', async () => {
    const profileId = await seedProfile(orm);
    const settings = GenerationSettings.createDefault(profileId);

    await repo.save(settings);
    orm.em.clear();

    const loaded = await repo.findByProfileId(profileId);
    expect(loaded).not.toBeNull();
    expect(loaded!.profileId).toBe(profileId);
    expect(loaded!.modelTier).toBe(ModelTier.BALANCED);
    expect(loaded!.bulletMin).toBe(2);
    expect(loaded!.bulletMax).toBe(5);
    expect(loaded!.prompts).toHaveLength(0);
  });

  it('updates model tier and bullet range', async () => {
    const profileId = await seedProfile(orm);
    const settings = GenerationSettings.createDefault(profileId);
    await repo.save(settings);
    orm.em.clear();

    const loaded = await repo.findByProfileId(profileId);
    loaded!.updateModelTier(ModelTier.BEST);
    loaded!.updateBulletRange(3, 7);
    await repo.save(loaded!);
    orm.em.clear();

    const reloaded = await repo.findByProfileId(profileId);
    expect(reloaded!.modelTier).toBe(ModelTier.BEST);
    expect(reloaded!.bulletMin).toBe(3);
    expect(reloaded!.bulletMax).toBe(7);
  });

  it('saves and retrieves prompts', async () => {
    const profileId = await seedProfile(orm);
    const settings = GenerationSettings.createDefault(profileId);
    settings.setPrompt(GenerationScope.RESUME, 'Always use past tense.');
    settings.setPrompt(GenerationScope.HEADLINE, 'Keep it under 100 chars.');

    await repo.save(settings);
    orm.em.clear();

    const loaded = await repo.findByProfileId(profileId);
    expect(loaded!.prompts).toHaveLength(2);
    expect(loaded!.getPrompt(GenerationScope.RESUME)).toBe('Always use past tense.');
    expect(loaded!.getPrompt(GenerationScope.HEADLINE)).toBe('Keep it under 100 chars.');
  });

  it('updates existing prompts', async () => {
    const profileId = await seedProfile(orm);
    const settings = GenerationSettings.createDefault(profileId);
    settings.setPrompt(GenerationScope.RESUME, 'Original prompt.');
    await repo.save(settings);
    orm.em.clear();

    const loaded = await repo.findByProfileId(profileId);
    loaded!.setPrompt(GenerationScope.RESUME, 'Updated prompt.');
    await repo.save(loaded!);
    orm.em.clear();

    const reloaded = await repo.findByProfileId(profileId);
    expect(reloaded!.prompts).toHaveLength(1);
    expect(reloaded!.getPrompt(GenerationScope.RESUME)).toBe('Updated prompt.');
  });

  it('removes prompts via cascade sync', async () => {
    const profileId = await seedProfile(orm);
    const settings = GenerationSettings.createDefault(profileId);
    settings.setPrompt(GenerationScope.RESUME, 'Will be removed.');
    settings.setPrompt(GenerationScope.EXPERIENCE, 'Will stay.');
    await repo.save(settings);
    orm.em.clear();

    const loaded = await repo.findByProfileId(profileId);
    loaded!.removePrompt(GenerationScope.RESUME);
    await repo.save(loaded!);
    orm.em.clear();

    const reloaded = await repo.findByProfileId(profileId);
    expect(reloaded!.prompts).toHaveLength(1);
    expect(reloaded!.getPrompt(GenerationScope.RESUME)).toBeNull();
    expect(reloaded!.getPrompt(GenerationScope.EXPERIENCE)).toBe('Will stay.');
  });
});
