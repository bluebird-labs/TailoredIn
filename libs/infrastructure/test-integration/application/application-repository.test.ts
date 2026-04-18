import type { MikroORM } from '@mikro-orm/postgresql';
import { Application, ApplicationStatus, Company, EntityNotFoundError, Profile } from '@tailoredin/domain';
import { PostgresApplicationRepository } from '../../src/application/PostgresApplicationRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresApplicationRepository', () => {
  let orm: MikroORM;
  let repo: PostgresApplicationRepository;
  let profileId: string;
  let companyId: string;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresApplicationRepository(orm);

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

    const company = Company.create({
      name: 'Test Corp',
      domainName: `test-${crypto.randomUUID()}.com`,
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null
    });
    orm.em.persist(company);
    await orm.em.flush();

    profileId = profile.id;
    companyId = company.id;
    orm.em.clear();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Application, {});
    orm.em.clear();
  });

  function createApplication(overrides?: Partial<Parameters<typeof Application.create>[0]>) {
    return Application.create({
      profileId,
      companyId,
      ...overrides
    });
  }

  async function seedApplication(overrides?: Partial<Parameters<typeof Application.create>[0]>): Promise<Application> {
    const app = createApplication(overrides);
    orm.em.persist(app);
    await orm.em.flush();
    orm.em.clear();
    return app;
  }

  describe('findById', () => {
    it('returns null when not found', async () => {
      const result = await repo.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('returns application when found', async () => {
      const app = await seedApplication({ status: ApplicationStatus.APPLIED, notes: 'Great fit' });

      const result = await repo.findById(app.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(app.id);
      expect(result!.status).toBe(ApplicationStatus.APPLIED);
      expect(result!.notes).toBe('Great fit');
    });
  });

  describe('findByProfileId', () => {
    it('returns empty array when none exist', async () => {
      const result = await repo.findByProfileId(crypto.randomUUID());
      expect(result).toEqual([]);
    });

    it('returns applications ordered by appliedAt DESC', async () => {
      const app1 = createApplication({ notes: 'oldest' });
      const app2 = createApplication({ notes: 'newest' });
      const app3 = createApplication({ notes: 'middle' });

      orm.em.persist(app1);
      orm.em.persist(app2);
      orm.em.persist(app3);
      await orm.em.flush();

      // Set distinct appliedAt via raw SQL since field is readonly
      const conn = orm.em.getConnection();
      await conn.execute(`UPDATE applications SET applied_at = '2024-01-01' WHERE id = ?`, [app1.id]);
      await conn.execute(`UPDATE applications SET applied_at = '2024-03-01' WHERE id = ?`, [app2.id]);
      await conn.execute(`UPDATE applications SET applied_at = '2024-02-01' WHERE id = ?`, [app3.id]);
      orm.em.clear();

      const result = await repo.findByProfileId(profileId);
      expect(result).toHaveLength(3);
      expect(result[0].notes).toBe('newest');
      expect(result[1].notes).toBe('middle');
      expect(result[2].notes).toBe('oldest');
    });
  });

  describe('save', () => {
    it('persists a new application', async () => {
      const app = createApplication({ notes: 'Test note' });
      await repo.save(app);
      orm.em.clear();

      const loaded = await repo.findById(app.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.notes).toBe('Test note');
      expect(loaded!.profileId).toBe(profileId);
      expect(loaded!.companyId).toBe(companyId);
    });

    it('updates existing application', async () => {
      const app = await seedApplication();

      const loaded = await repo.findById(app.id);
      loaded!.status = ApplicationStatus.INTERVIEWING;
      loaded!.notes = 'Updated notes';
      await repo.save(loaded!);
      orm.em.clear();

      const reloaded = await repo.findById(app.id);
      expect(reloaded!.status).toBe(ApplicationStatus.INTERVIEWING);
      expect(reloaded!.notes).toBe('Updated notes');
    });
  });

  describe('delete', () => {
    it('removes an application', async () => {
      const app = await seedApplication();

      await repo.delete(app.id);
      orm.em.clear();

      const result = await repo.findById(app.id);
      expect(result).toBeNull();
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      expect(repo.delete(crypto.randomUUID())).rejects.toThrow(EntityNotFoundError);
    });
  });
});
