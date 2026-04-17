import type { MikroORM } from '@mikro-orm/postgresql';
import { Education, Profile } from '@tailoredin/domain';
import { PostgresEducationRepository } from '../../src/education/PostgresEducationRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresEducationRepository', () => {
  let orm: MikroORM;
  let repo: PostgresEducationRepository;
  let profileId: string;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresEducationRepository(orm);

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
    await orm.em.nativeDelete(Education, {});
    orm.em.clear();
  });

  function createEducation(overrides?: Partial<Parameters<typeof Education.create>[0]>) {
    return Education.create({
      profileId,
      degreeTitle: 'B.S. Computer Science',
      institutionName: 'MIT',
      graduationYear: 2020,
      location: null,
      honors: null,
      ordinal: 0,
      ...overrides
    });
  }

  async function seedEducation(overrides?: Partial<Parameters<typeof Education.create>[0]>): Promise<Education> {
    const edu = createEducation(overrides);
    orm.em.persist(edu);
    await orm.em.flush();
    orm.em.clear();
    return edu;
  }

  describe('findAll', () => {
    it('returns empty array when no educations exist', async () => {
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });

    it('returns educations ordered by ordinal ASC', async () => {
      await seedEducation({ degreeTitle: 'PhD Physics', ordinal: 2 });
      await seedEducation({ degreeTitle: 'B.S. CS', ordinal: 0 });
      await seedEducation({ degreeTitle: 'M.S. CS', ordinal: 1 });

      const result = await repo.findAll();
      expect(result.map(e => e.degreeTitle)).toEqual(['B.S. CS', 'M.S. CS', 'PhD Physics']);
    });
  });

  describe('findByIdOrFail', () => {
    it('returns education when found', async () => {
      const edu = await seedEducation({ degreeTitle: 'B.S. CS', honors: 'Magna Cum Laude' });

      const result = await repo.findByIdOrFail(edu.id);
      expect(result.id).toBe(edu.id);
      expect(result.degreeTitle).toBe('B.S. CS');
      expect(result.honors).toBe('Magna Cum Laude');
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      expect(repo.findByIdOrFail(crypto.randomUUID())).rejects.toThrow('not found');
    });
  });

  describe('save', () => {
    it('persists a new education', async () => {
      const edu = createEducation({ degreeTitle: 'MBA', institutionName: 'Stanford' });
      await repo.save(edu);
      orm.em.clear();

      const loaded = await repo.findByIdOrFail(edu.id);
      expect(loaded.degreeTitle).toBe('MBA');
      expect(loaded.institutionName).toBe('Stanford');
      expect(loaded.profileId).toBe(profileId);
    });

    it('updates existing education', async () => {
      const edu = await seedEducation({ degreeTitle: 'B.S. CS' });

      const loaded = await repo.findByIdOrFail(edu.id);
      loaded.degreeTitle = 'B.S. Computer Science';
      loaded.honors = 'Summa Cum Laude';
      await repo.save(loaded);
      orm.em.clear();

      const reloaded = await repo.findByIdOrFail(edu.id);
      expect(reloaded.degreeTitle).toBe('B.S. Computer Science');
      expect(reloaded.honors).toBe('Summa Cum Laude');
    });
  });

  describe('delete', () => {
    it('removes an education', async () => {
      const edu = await seedEducation();

      await repo.delete(edu.id);
      orm.em.clear();

      expect(repo.findByIdOrFail(edu.id)).rejects.toThrow('not found');
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      expect(repo.delete(crypto.randomUUID())).rejects.toThrow('not found');
    });
  });
});
