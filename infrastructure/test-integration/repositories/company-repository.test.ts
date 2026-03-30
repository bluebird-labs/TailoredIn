import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { PostgresCompanyRepository } from '../../src/repositories/PostgresCompanyRepository.js';
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

  test('upsertByLinkedinLink inserts a new company', async () => {
    const company = await repo.upsertByLinkedinLink({
      name: 'Acme Inc',
      linkedinLink: 'https://linkedin.com/company/acme',
      website: 'https://acme.com',
      logoUrl: null
    });

    expect(company.name).toBe('Acme Inc');
    expect(company.linkedinLink).toBe('https://linkedin.com/company/acme');
    expect(company.website).toBe('https://acme.com');
    expect(company.id.value).toBeString();
  });

  test('upsertByLinkedinLink updates on conflict', async () => {
    const first = await repo.upsertByLinkedinLink({
      name: 'Beta Corp',
      linkedinLink: 'https://linkedin.com/company/beta',
      website: null,
      logoUrl: null
    });

    const second = await repo.upsertByLinkedinLink({
      name: 'Beta Corporation',
      linkedinLink: 'https://linkedin.com/company/beta',
      website: 'https://beta.com',
      logoUrl: 'https://logo.com/beta.png'
    });

    expect(second.id.value).toBe(first.id.value);
    expect(second.name).toBe('Beta Corporation');
    expect(second.website).toBe('https://beta.com');
  });

  test('save updates company fields', async () => {
    const company = await repo.upsertByLinkedinLink({
      name: 'Gamma LLC',
      linkedinLink: 'https://linkedin.com/company/gamma',
      website: null,
      logoUrl: null
    });

    company.name = 'Gamma Inc';
    company.website = 'https://gamma.io';
    company.updatedAt = new Date();
    await repo.save(company);

    const updated = await repo.upsertByLinkedinLink({
      name: 'Gamma Inc',
      linkedinLink: 'https://linkedin.com/company/gamma',
      website: 'https://gamma.io',
      logoUrl: null
    });

    expect(updated.name).toBe('Gamma Inc');
    expect(updated.website).toBe('https://gamma.io');
  });
});
