import { Company } from '../../src/entities/Company.js';
import { BusinessType } from '../../src/value-objects/BusinessType.js';
import { CompanyStage } from '../../src/value-objects/CompanyStage.js';
import { Industry } from '../../src/value-objects/Industry.js';

describe('Company', () => {
  const makeCompany = (overrides?: Partial<Parameters<typeof Company.create>[0]>) =>
    Company.create({
      name: 'Acme Corp',
      description: 'A test company',
      website: 'https://acme.com',
      logoUrl: null,
      linkedinLink: null,
      ...overrides
    });

  test('creates with generated id and timestamps', () => {
    const company = makeCompany();
    expect(company.id).toBeDefined();
    expect(company.name).toBe('Acme Corp');
    expect(company.description).toBe('A test company');
    expect(company.website).toBe('https://acme.com');
    expect(company.createdAt).toBeInstanceOf(Date);
    expect(company.updatedAt).toBeInstanceOf(Date);
  });

  test('defaults optional enum fields to UNKNOWN', () => {
    const company = makeCompany();
    expect(company.businessType).toBe(BusinessType.UNKNOWN);
    expect(company.industry).toBe(Industry.UNKNOWN);
    expect(company.stage).toBe(CompanyStage.UNKNOWN);
  });

  test('accepts optional enum fields', () => {
    const company = makeCompany({
      businessType: BusinessType.B2B,
      industry: Industry.SOFTWARE,
      stage: CompanyStage.LATE_STAGE
    });
    expect(company.businessType).toBe(BusinessType.B2B);
    expect(company.industry).toBe(Industry.SOFTWARE);
    expect(company.stage).toBe(CompanyStage.LATE_STAGE);
  });

  test('setWebsite updates website and updatedAt', () => {
    const company = makeCompany();
    const before = company.updatedAt;
    company.setWebsite('https://new.com');
    expect(company.website).toBe('https://new.com');
    expect(company.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('setBusinessType updates businessType', () => {
    const company = makeCompany();
    company.setBusinessType(BusinessType.B2C);
    expect(company.businessType).toBe(BusinessType.B2C);
  });

  test('setIndustry updates industry', () => {
    const company = makeCompany();
    company.setIndustry(Industry.HEALTHCARE);
    expect(company.industry).toBe(Industry.HEALTHCARE);
  });

  test('setStage updates stage', () => {
    const company = makeCompany();
    company.setStage(CompanyStage.PUBLIC);
    expect(company.stage).toBe(CompanyStage.PUBLIC);
  });
});
