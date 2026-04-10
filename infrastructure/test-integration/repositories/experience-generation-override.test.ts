import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { Experience, ExperienceGenerationOverride, Profile } from '@tailoredin/domain';
import { PostgresExperienceGenerationOverrideRepository } from '../../src/repositories/PostgresExperienceGenerationOverrideRepository.js';
import { PostgresExperienceRepository } from '../../src/repositories/PostgresExperienceRepository.js';
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

async function seedExperience(orm: MikroORM, profileId: string): Promise<string> {
  const expRepo = new PostgresExperienceRepository(orm);
  const exp = Experience.create({
    profileId,
    title: 'Engineer',
    companyName: 'TestCo',
    companyWebsite: null,
    companyAccent: null,
    location: 'Remote',
    startDate: '2020-01',
    endDate: '2023-01',
    summary: null,
    ordinal: 0
  });
  await expRepo.save(exp);
  return exp.id;
}

describe('PostgresExperienceGenerationOverrideRepository', () => {
  let orm: MikroORM;
  let repo: PostgresExperienceGenerationOverrideRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresExperienceGenerationOverrideRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('returns null when no override exists', async () => {
    const result = await repo.findByExperienceId(crypto.randomUUID());
    expect(result).toBeNull();
  });

  it('saves and retrieves an override', async () => {
    const profileId = await seedProfile(orm);
    const experienceId = await seedExperience(orm, profileId);
    orm.em.clear();

    const override = ExperienceGenerationOverride.create({ experienceId, bulletMin: 3, bulletMax: 6 });
    await repo.save(override);
    orm.em.clear();

    const loaded = await repo.findByExperienceId(experienceId);
    expect(loaded).not.toBeNull();
    expect(loaded!.experienceId).toBe(experienceId);
    expect(loaded!.bulletMin).toBe(3);
    expect(loaded!.bulletMax).toBe(6);
  });

  it('updates an existing override', async () => {
    const profileId = await seedProfile(orm);
    const experienceId = await seedExperience(orm, profileId);
    orm.em.clear();

    const override = ExperienceGenerationOverride.create({ experienceId, bulletMin: 2, bulletMax: 4 });
    await repo.save(override);
    orm.em.clear();

    const loaded = await repo.findByExperienceId(experienceId);
    loaded!.updateBulletRange(5, 8);
    await repo.save(loaded!);
    orm.em.clear();

    const reloaded = await repo.findByExperienceId(experienceId);
    expect(reloaded!.bulletMin).toBe(5);
    expect(reloaded!.bulletMax).toBe(8);
  });

  it('finds overrides by multiple experience IDs', async () => {
    const profileId = await seedProfile(orm);
    const expId1 = await seedExperience(orm, profileId);
    const expId2 = await seedExperience(orm, profileId);
    const expId3 = await seedExperience(orm, profileId);
    orm.em.clear();

    await repo.save(ExperienceGenerationOverride.create({ experienceId: expId1, bulletMin: 1, bulletMax: 3 }));
    await repo.save(ExperienceGenerationOverride.create({ experienceId: expId3, bulletMin: 4, bulletMax: 6 }));
    orm.em.clear();

    const results = await repo.findByExperienceIds([expId1, expId2, expId3]);
    expect(results).toHaveLength(2);

    const ids = results.map(r => r.experienceId).sort();
    expect(ids).toEqual([expId1, expId3].sort());
  });

  it('returns empty array for empty experienceIds input', async () => {
    const results = await repo.findByExperienceIds([]);
    expect(results).toHaveLength(0);
  });

  it('deletes an override by experience ID', async () => {
    const profileId = await seedProfile(orm);
    const experienceId = await seedExperience(orm, profileId);
    orm.em.clear();

    await repo.save(ExperienceGenerationOverride.create({ experienceId, bulletMin: 2, bulletMax: 4 }));
    orm.em.clear();

    await repo.delete(experienceId);
    orm.em.clear();

    const result = await repo.findByExperienceId(experienceId);
    expect(result).toBeNull();
  });

  it('delete is a no-op when override does not exist', async () => {
    await repo.delete(crypto.randomUUID());
    // Should not throw
  });

  it('cascade deletes override when experience is deleted', async () => {
    const profileId = await seedProfile(orm);
    const expRepo = new PostgresExperienceRepository(orm);
    const exp = Experience.create({
      profileId,
      title: 'Engineer',
      companyName: 'CascadeCo',
      companyWebsite: null,
      companyAccent: null,
      location: 'Remote',
      startDate: '2021-01',
      endDate: '2022-01',
      summary: null,
      ordinal: 0
    });
    await expRepo.save(exp);
    orm.em.clear();

    await repo.save(ExperienceGenerationOverride.create({ experienceId: exp.id, bulletMin: 1, bulletMax: 2 }));
    orm.em.clear();

    await expRepo.delete(exp.id);
    orm.em.clear();

    const result = await repo.findByExperienceId(exp.id);
    expect(result).toBeNull();
  });
});
