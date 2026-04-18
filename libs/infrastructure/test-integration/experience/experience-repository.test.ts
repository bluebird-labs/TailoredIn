import type { MikroORM } from '@mikro-orm/postgresql';
import { Experience, Profile } from '@tailoredin/domain';
import { PostgresExperienceRepository } from '../../src/experience/PostgresExperienceRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresExperienceRepository', () => {
  let orm: MikroORM;
  let repo: PostgresExperienceRepository;
  let profileId: string;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresExperienceRepository(orm);

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
    profileId = profile.id;
    orm.em.clear();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Experience, {});
    orm.em.clear();
  });

  function createExperience(overrides?: Partial<Parameters<typeof Experience.create>[0]>) {
    return Experience.create({
      profileId,
      title: 'Software Engineer',
      companyName: 'ACME',
      companyWebsite: null,
      companyAccent: null,
      companyId: null,
      location: 'Remote',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0,
      bulletMin: 2,
      bulletMax: 5,
      ...overrides
    });
  }

  async function seedExperience(overrides?: Partial<Parameters<typeof Experience.create>[0]>): Promise<Experience> {
    const exp = createExperience(overrides);
    orm.em.persist(exp);
    await orm.em.flush();
    orm.em.clear();
    return exp;
  }

  describe('findAll', () => {
    it('returns empty array when no experiences exist', async () => {
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });

    it('returns experiences ordered by ordinal ASC', async () => {
      await seedExperience({ title: 'Staff Engineer', ordinal: 2 });
      await seedExperience({ title: 'Junior Engineer', ordinal: 0 });
      await seedExperience({ title: 'Senior Engineer', ordinal: 1 });

      const result = await repo.findAll();
      expect(result.map(e => e.title)).toEqual(['Junior Engineer', 'Senior Engineer', 'Staff Engineer']);
    });

    it('populates accomplishments', async () => {
      const exp = createExperience({ title: 'Lead Engineer' });
      exp.addAccomplishment({
        title: 'Led migration',
        narrative: 'Migrated to microservices',
        ordinal: 0
      });
      orm.em.persist(exp);
      await orm.em.flush();
      orm.em.clear();

      const result = await repo.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].accomplishments).toHaveLength(1);
      expect(result[0].accomplishments[0].title).toBe('Led migration');
    });
  });

  describe('findByIdOrFail', () => {
    it('returns experience with populated accomplishments', async () => {
      const exp = createExperience({ title: 'Senior Engineer' });
      exp.addAccomplishment({
        title: 'Billing sharding',
        narrative: 'Led hash-based sharding migration.',
        ordinal: 0
      });
      orm.em.persist(exp);
      await orm.em.flush();
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(exp.id);
      expect(loaded.title).toBe('Senior Engineer');
      expect(loaded.accomplishments).toHaveLength(1);
      expect(loaded.accomplishments[0].title).toBe('Billing sharding');
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      expect(repo.findByIdOrFail(crypto.randomUUID())).rejects.toThrow('not found');
    });
  });

  describe('save', () => {
    it('persists a new experience', async () => {
      const exp = createExperience({ title: 'CTO', companyName: 'StartupCo' });
      await repo.save(exp);
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(exp.id);
      expect(loaded.title).toBe('CTO');
      expect(loaded.companyName).toBe('StartupCo');
    });

    it('persists experience with accomplishments', async () => {
      const exp = createExperience();
      exp.addAccomplishment({ title: 'A', narrative: 'N', ordinal: 0 });
      await repo.save(exp);
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(exp.id);
      expect(loaded.accomplishments).toHaveLength(1);
    });

    it('removes accomplishment on save', async () => {
      const exp = createExperience();
      exp.addAccomplishment({ title: 'A', narrative: 'N', ordinal: 0 });
      await repo.save(exp);
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(exp.id);
      loaded.removeAccomplishment(loaded.accomplishments[0].id);
      await repo.save(loaded);
      orm.em.clear();

      const reloaded = await repo.findByIdOrFail(exp.id);
      expect(reloaded.accomplishments).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('removes an experience', async () => {
      const exp = await seedExperience();

      await repo.delete(exp.id);
      orm.em.clear();

      expect(repo.findByIdOrFail(exp.id)).rejects.toThrow('not found');
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      expect(repo.delete(crypto.randomUUID())).rejects.toThrow('not found');
    });
  });
});
