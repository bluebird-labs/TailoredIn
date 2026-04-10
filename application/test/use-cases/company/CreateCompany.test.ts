import { describe, expect, test } from 'bun:test';
import { BusinessType, type Company, type CompanyRepository, Industry } from '@tailoredin/domain';
import { CreateCompany } from '../../../src/use-cases/company/CreateCompany.js';

function mockCompanyRepo(onSave?: (c: Company) => void): CompanyRepository {
  return {
    findById: async () => null,
    upsertByLinkedinLink: async () => {
      throw new Error('Not implemented');
    },
    save: async (c: Company) => {
      onSave?.(c);
    }
  };
}

describe('CreateCompany', () => {
  test('creates company with all fields and returns DTO', async () => {
    let saved: Company | undefined;

    const useCase = new CreateCompany(
      mockCompanyRepo(c => {
        saved = c;
      })
    );

    const dto = await useCase.execute({
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: BusinessType.PLATFORM,
      industry: Industry.SOFTWARE,
      stage: null
    });

    expect(dto.id).toBeString();
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.name).toBe('GitHub');
    expect(dto.website).toBe('https://github.com');
    expect(dto.logoUrl).toBe('https://logo.com/gh.png');
    expect(dto.linkedinLink).toBe('https://linkedin.com/company/github');
    expect(dto.businessType).toBe(BusinessType.PLATFORM);
    expect(dto.industry).toBe(Industry.SOFTWARE);
    expect(dto.stage).toBeNull();
    expect(saved).toBeDefined();
  });

  test('creates company with minimal fields (name only)', async () => {
    const useCase = new CreateCompany(mockCompanyRepo());

    const dto = await useCase.execute({
      name: 'SomeCo',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    });

    expect(dto.name).toBe('SomeCo');
    expect(dto.website).toBeNull();
    expect(dto.linkedinLink).toBeNull();
  });
});
