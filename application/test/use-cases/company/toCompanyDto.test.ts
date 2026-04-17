import { BusinessType, Company, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';
import { toCompanyDto } from '../../../src/dtos/CompanyDto.js';

describe('toCompanyDto', () => {
  test('maps domain Company to CompanyDto', () => {
    const company = new Company({
      id: 'abc-123',
      name: 'GitHub',
      domainName: 'github.com',
      description: null,
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: BusinessType.UNKNOWN,
      industry: Industry.UNKNOWN,
      stage: CompanyStage.UNKNOWN,
      status: CompanyStatus.RUNNING,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    });

    const dto = toCompanyDto(company);

    expect(dto).toEqual({
      id: 'abc-123',
      name: 'GitHub',
      domainName: 'github.com',
      description: null,
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: BusinessType.UNKNOWN,
      industry: Industry.UNKNOWN,
      stage: CompanyStage.UNKNOWN,
      status: CompanyStatus.RUNNING
    });
  });

  test('maps null linkedinLink correctly', () => {
    const company = new Company({
      id: 'abc-456',
      name: 'SomeCo',
      domainName: 'someco.com',
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: BusinessType.UNKNOWN,
      industry: Industry.UNKNOWN,
      stage: CompanyStage.UNKNOWN,
      status: CompanyStatus.UNKNOWN,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    });

    const dto = toCompanyDto(company);

    expect(dto.linkedinLink).toBeNull();
  });
});
