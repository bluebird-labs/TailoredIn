import type { MikroORM } from '@mikro-orm/postgresql';
import { Company, EntityNotFoundError } from '@tailoredin/domain';
import { PostgresCompanyRepository } from '../../src/company/PostgresCompanyRepository.js';
import { setupTestDatabase, teardownTestDatabase } from '../support/TestDatabase.js';

describe('PostgresCompanyRepository', () => {
  let orm: MikroORM;
  let repo: PostgresCompanyRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresCompanyRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Company, {});
    orm.em.clear();
  });

  function createCompany(overrides: Partial<Parameters<typeof Company.create>[0]> & { name: string }) {
    return Company.create({
      domainName: `${overrides.name.toLowerCase().replace(/\s+/g, '')}.com`,
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      ...overrides
    });
  }

  async function seedCompany(
    overrides: Partial<Parameters<typeof Company.create>[0]> & { name: string }
  ): Promise<Company> {
    const company = createCompany(overrides);
    orm.em.persist(company);
    await orm.em.flush();
    orm.em.clear();
    return company;
  }

  describe('findAll', () => {
    it('returns empty array when no companies exist', async () => {
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });

    it('returns companies ordered by name ASC', async () => {
      await seedCompany({ name: 'Zebra Corp' });
      await seedCompany({ name: 'Acme Inc' });
      await seedCompany({ name: 'Mid Corp' });

      const result = await repo.findAll();
      expect(result.map(c => c.name)).toEqual(['Acme Inc', 'Mid Corp', 'Zebra Corp']);
    });
  });

  describe('findById', () => {
    it('returns null when not found', async () => {
      const result = await repo.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('returns company when found', async () => {
      const company = await seedCompany({ name: 'Acme Inc', website: 'https://acme.com' });

      const result = await repo.findById(company.id);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Acme Inc');
      expect(result!.website).toBe('https://acme.com');
    });
  });

  describe('upsertByLinkedinLink', () => {
    it('inserts a new company', async () => {
      const company = await repo.upsertByLinkedinLink({
        name: 'Acme Inc',
        domainName: 'acme.com',
        description: null,
        linkedinLink: 'https://linkedin.com/company/acme',
        website: 'https://acme.com',
        logoUrl: null
      });

      expect(company.name).toBe('Acme Inc');
      expect(company.linkedinLink).toBe('https://linkedin.com/company/acme');
      expect(company.website).toBe('https://acme.com');
      expect(typeof company.id).toBe('string');
    });

    it('updates on conflict', async () => {
      const first = await repo.upsertByLinkedinLink({
        name: 'Beta Corp',
        domainName: 'beta.com',
        description: null,
        linkedinLink: 'https://linkedin.com/company/beta',
        website: null,
        logoUrl: null
      });

      const second = await repo.upsertByLinkedinLink({
        name: 'Beta Corporation',
        domainName: 'beta.com',
        description: null,
        linkedinLink: 'https://linkedin.com/company/beta',
        website: 'https://beta.com',
        logoUrl: 'https://logo.com/beta.png'
      });

      expect(second.id).toBe(first.id);
      expect(second.name).toBe('Beta Corporation');
      expect(second.website).toBe('https://beta.com');
    });
  });

  describe('save', () => {
    it('persists a new company', async () => {
      const company = createCompany({ name: 'NewCo', website: 'https://newco.com' });
      await repo.save(company);
      orm.em.clear();

      const loaded = await repo.findById(company.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('NewCo');
      expect(loaded!.website).toBe('https://newco.com');
    });

    it('updates existing company fields', async () => {
      const company = await seedCompany({ name: 'Gamma LLC' });

      const loaded = await repo.findById(company.id);
      loaded!.name = 'Gamma Inc';
      loaded!.website = 'https://gamma.io';
      loaded!.updatedAt = new Date();
      await repo.save(loaded!);
      orm.em.clear();

      const reloaded = await repo.findById(company.id);
      expect(reloaded!.name).toBe('Gamma Inc');
      expect(reloaded!.website).toBe('https://gamma.io');
    });
  });

  describe('delete', () => {
    it('removes a company', async () => {
      const company = await seedCompany({ name: 'Doomed Corp' });

      await repo.delete(company.id);
      orm.em.clear();

      const result = await repo.findById(company.id);
      expect(result).toBeNull();
    });

    it('throws EntityNotFoundError for non-existent id', async () => {
      const id = crypto.randomUUID();
      expect(repo.delete(id)).rejects.toThrow(EntityNotFoundError);
    });
  });
});
