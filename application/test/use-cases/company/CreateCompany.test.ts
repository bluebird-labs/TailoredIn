import {
  BusinessType,
  type Company,
  type CompanyRepository,
  CompanyStage,
  CompanyStatus,
  Industry
} from '@tailoredin/domain';
import { CreateCompany } from '../../../src/use-cases/company/CreateCompany.js';

function mockCompanyRepo(onSave?: (c: Company) => void): CompanyRepository {
  return {
    findAll: async () => [],
    findById: async () => null,
    upsertByLinkedinLink: async () => {
      throw new Error('Not implemented');
    },
    save: async (c: Company) => {
      onSave?.(c);
    },
    delete: async () => {}
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
      domainName: 'github.com',
      description: null,
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: BusinessType.PLATFORM,
      industry: Industry.SOFTWARE,
      stage: CompanyStage.LATE_STAGE,
      status: CompanyStatus.RUNNING
    });

    expect(typeof dto.id).toBe('string');
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.name).toBe('GitHub');
    expect(dto.domainName).toBe('github.com');
    expect(dto.website).toBe('https://github.com');
    expect(dto.logoUrl).toBe('https://logo.com/gh.png');
    expect(dto.linkedinLink).toBe('https://linkedin.com/company/github');
    expect(dto.businessType).toBe(BusinessType.PLATFORM);
    expect(dto.industry).toBe(Industry.SOFTWARE);
    expect(dto.stage).toBe(CompanyStage.LATE_STAGE);
    expect(saved).toBeDefined();
  });

  test('creates company with minimal fields (name only)', async () => {
    const useCase = new CreateCompany(mockCompanyRepo());

    const dto = await useCase.execute({
      name: 'SomeCo',
      domainName: 'someco.com',
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: BusinessType.UNKNOWN,
      industry: Industry.UNKNOWN,
      stage: CompanyStage.UNKNOWN,
      status: CompanyStatus.UNKNOWN
    });

    expect(dto.name).toBe('SomeCo');
    expect(dto.website).toBeNull();
    expect(dto.linkedinLink).toBeNull();
  });
});
