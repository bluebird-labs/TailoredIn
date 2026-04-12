import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { Company, EntityNotFoundError, JobDescription, JobSource } from '@tailoredin/domain';
import { PostgresJobDescriptionRepository } from '../../src/job/PostgresJobDescriptionRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresJobDescriptionRepository', () => {
  let orm: MikroORM;
  let repo: PostgresJobDescriptionRepository;
  let companyId: string;
  let otherCompanyId: string;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresJobDescriptionRepository(orm);

    const company = Company.create({
      name: 'Test Corp',
      domainName: `test-${crypto.randomUUID()}.com`,
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null
    });
    const otherCompany = Company.create({
      name: 'Other Corp',
      domainName: `other-${crypto.randomUUID()}.com`,
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null
    });
    orm.em.persist(company);
    orm.em.persist(otherCompany);
    await orm.em.flush();
    companyId = company.id;
    otherCompanyId = otherCompany.id;
    orm.em.clear();
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(JobDescription, {});
    orm.em.clear();
  });

  function createJd(overrides?: Partial<Parameters<typeof JobDescription.create>[0]>) {
    return JobDescription.create({
      companyId,
      title: 'Software Engineer',
      description: 'Build great software',
      source: JobSource.LINKEDIN,
      ...overrides
    });
  }

  async function seedJd(overrides?: Partial<Parameters<typeof JobDescription.create>[0]>): Promise<JobDescription> {
    const jd = createJd(overrides);
    orm.em.persist(jd);
    await orm.em.flush();
    orm.em.clear();
    return jd;
  }

  describe('findAll', () => {
    it('returns empty array when no job descriptions exist', async () => {
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });

    it('returns job descriptions ordered by createdAt DESC', async () => {
      const jd1 = createJd({ title: 'Oldest' });
      const jd2 = createJd({ title: 'Newest' });
      const jd3 = createJd({ title: 'Middle' });

      orm.em.persist(jd1);
      orm.em.persist(jd2);
      orm.em.persist(jd3);
      await orm.em.flush();

      const conn = orm.em.getConnection();
      await conn.execute(`UPDATE job_descriptions SET created_at = '2024-01-01' WHERE id = ?`, [jd1.id]);
      await conn.execute(`UPDATE job_descriptions SET created_at = '2024-03-01' WHERE id = ?`, [jd2.id]);
      await conn.execute(`UPDATE job_descriptions SET created_at = '2024-02-01' WHERE id = ?`, [jd3.id]);
      orm.em.clear();

      const result = await repo.findAll();
      expect(result.map(j => j.title)).toEqual(['Newest', 'Middle', 'Oldest']);
    });
  });

  describe('findById', () => {
    it('returns null when not found', async () => {
      const result = await repo.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('returns job description when found', async () => {
      const jd = await seedJd({ title: 'Staff Engineer', location: 'NYC' });

      const result = await repo.findById(jd.id);
      expect(result).not.toBeNull();
      expect(result!.title).toBe('Staff Engineer');
      expect(result!.location).toBe('NYC');
    });
  });

  describe('findByCompanyId', () => {
    it('returns empty array when no jobs for company', async () => {
      const result = await repo.findByCompanyId(crypto.randomUUID());
      expect(result).toEqual([]);
    });

    it('returns only jobs for the specified company', async () => {
      await seedJd({ title: 'Engineer', companyId });
      await seedJd({ title: 'Designer', companyId: otherCompanyId });

      const result = await repo.findByCompanyId(companyId);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Engineer');
    });

    it('returns jobs ordered by createdAt DESC', async () => {
      const jd1 = createJd({ title: 'Oldest' });
      const jd2 = createJd({ title: 'Newest' });

      orm.em.persist(jd1);
      orm.em.persist(jd2);
      await orm.em.flush();

      const conn = orm.em.getConnection();
      await conn.execute(`UPDATE job_descriptions SET created_at = '2024-01-01' WHERE id = ?`, [jd1.id]);
      await conn.execute(`UPDATE job_descriptions SET created_at = '2024-03-01' WHERE id = ?`, [jd2.id]);
      orm.em.clear();

      const result = await repo.findByCompanyId(companyId);
      expect(result.map(j => j.title)).toEqual(['Newest', 'Oldest']);
    });
  });

  describe('save', () => {
    it('persists a new job description', async () => {
      const jd = createJd({ title: 'Principal Engineer', source: JobSource.GREENHOUSE });
      await repo.save(jd);
      orm.em.clear();

      const loaded = await repo.findById(jd.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.title).toBe('Principal Engineer');
      expect(loaded!.source).toBe(JobSource.GREENHOUSE);
      expect(loaded!.companyId).toBe(companyId);
    });

    it('updates existing job description', async () => {
      const jd = await seedJd({ title: 'Engineer' });

      const loaded = await repo.findById(jd.id);
      loaded!.title = 'Senior Engineer';
      loaded!.location = 'San Francisco';
      await repo.save(loaded!);
      orm.em.clear();

      const reloaded = await repo.findById(jd.id);
      expect(reloaded!.title).toBe('Senior Engineer');
      expect(reloaded!.location).toBe('San Francisco');
    });
  });

  describe('delete', () => {
    it('removes a job description', async () => {
      const jd = await seedJd();

      await repo.delete(jd.id);
      orm.em.clear();

      const result = await repo.findById(jd.id);
      expect(result).toBeNull();
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      expect(repo.delete(crypto.randomUUID())).rejects.toThrow(EntityNotFoundError);
    });
  });
});
