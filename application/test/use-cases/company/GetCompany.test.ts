import { describe, expect, it, vi } from 'bun:test';
import { Company, type CompanyRepository } from '@tailoredin/domain';
import { GetCompany } from '../../../src/use-cases/company/GetCompany.js';

function makeCompany(overrides: Partial<ConstructorParameters<typeof Company>[0]> = {}): Company {
  return new Company({
    id: 'aaaaaaaa-1111-2222-3333-444444444444',
    name: 'Acme Corp',
    description: 'Leading SaaS platform',
    website: 'https://acme.com',
    logoUrl: null,
    linkedinLink: 'https://linkedin.com/company/acme',
    businessType: 'b2b',
    industry: 'software',
    stage: 'series_b',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });
}

describe('GetCompany', () => {
  it('returns a company DTO when found', async () => {
    const company = makeCompany();
    const repo: CompanyRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(company),
      upsertByLinkedinLink: vi.fn(),
      save: vi.fn()
    };

    const useCase = new GetCompany(repo);
    const result = await useCase.execute({ companyId: 'aaaaaaaa-1111-2222-3333-444444444444' });

    expect(result.id).toBe('aaaaaaaa-1111-2222-3333-444444444444');
    expect(result.name).toBe('Acme Corp');
    expect(result.description).toBe('Leading SaaS platform');
  });

  it('throws when company not found', async () => {
    const repo: CompanyRepository = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      upsertByLinkedinLink: vi.fn(),
      save: vi.fn()
    };

    const useCase = new GetCompany(repo);
    await expect(useCase.execute({ companyId: 'aaaaaaaa-1111-2222-3333-444444444444' })).rejects.toThrow(
      'Company not found'
    );
  });
});
