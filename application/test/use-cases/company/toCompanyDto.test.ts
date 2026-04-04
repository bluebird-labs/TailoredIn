import { describe, expect, test } from 'bun:test';
import { Company, CompanyId } from '@tailoredin/domain';
import { toCompanyDto } from '../../../src/dtos/CompanyDto.js';

describe('toCompanyDto', () => {
  test('maps domain Company to CompanyDto', () => {
    const company = new Company({
      id: new CompanyId('abc-123'),
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: null,
      industry: null,
      stage: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    });

    const dto = toCompanyDto(company);

    expect(dto).toEqual({
      id: 'abc-123',
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: null,
      industry: null,
      stage: null
    });
  });

  test('maps null linkedinLink correctly', () => {
    const company = new Company({
      id: new CompanyId('abc-456'),
      name: 'SomeCo',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01')
    });

    const dto = toCompanyDto(company);

    expect(dto.linkedinLink).toBeNull();
  });
});
