import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import { DeleteCompany } from '../../src/use-cases/DeleteCompany.js';

function createMockCompanyRepository(overrides: Partial<ResumeCompanyRepository> = {}): ResumeCompanyRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findAllByUserId: async () => [],
    save: async () => {},
    delete: async () => {},
    ...overrides
  };
}

describe('DeleteCompany', () => {
  test('returns error when company not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new DeleteCompany(repo);
    const result = await uc.execute({ companyId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Company not found');
    }
  });

  test('calls delete on repository', async () => {
    const company = ResumeCompany.create({
      userId: 'user-1',
      companyName: 'Acme',
      companyMention: null,
      websiteUrl: null,
      businessDomain: 'SaaS',
      joinedAt: '2020-01',
      leftAt: '2023-01',
      promotedAt: null,
      locations: [],
      bullets: []
    });
    let deletedId: string | null = null;
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company,
      delete: async id => {
        deletedId = id;
      }
    });
    const uc = new DeleteCompany(repo);
    const result = await uc.execute({ companyId: company.id.value });
    expect(result.isOk).toBe(true);
    expect(deletedId).toBe(company.id.value);
  });
});
