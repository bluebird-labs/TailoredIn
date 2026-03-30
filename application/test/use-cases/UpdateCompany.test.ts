import { describe, expect, test } from 'bun:test';
import { ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import { UpdateCompany } from '../../src/use-cases/UpdateCompany.js';

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

function makeCompany() {
  return ResumeCompany.create({
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
}

describe('UpdateCompany', () => {
  test('returns error when company not found', async () => {
    const repo = createMockCompanyRepository();
    const uc = new UpdateCompany(repo);
    const result = await uc.execute({ companyId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Company not found');
    }
  });

  test('updates specified fields and saves', async () => {
    const company = makeCompany();
    let saved = false;
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company,
      save: async () => {
        saved = true;
      }
    });
    const uc = new UpdateCompany(repo);
    const result = await uc.execute({
      companyId: company.id.value,
      companyName: 'NewName',
      businessDomain: 'Fintech'
    });

    expect(result.isOk).toBe(true);
    expect(company.companyName).toBe('NewName');
    expect(company.businessDomain).toBe('Fintech');
    expect(saved).toBe(true);
  });

  test('skips undefined fields', async () => {
    const company = makeCompany();
    const repo = createMockCompanyRepository({
      findByIdOrFail: async () => company
    });
    const uc = new UpdateCompany(repo);
    await uc.execute({ companyId: company.id.value, companyName: 'Changed' });

    expect(company.companyName).toBe('Changed');
    expect(company.businessDomain).toBe('SaaS');
  });
});
