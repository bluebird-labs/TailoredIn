import { BusinessType, Company, type CompanyRepository, CompanyStage, Industry } from '@tailoredin/domain';
import { ListCompanies } from '../../../src/use-cases/company/ListCompanies.js';

function mockCompanyRepo(companies: Company[]): CompanyRepository {
  return {
    findAll: async () => companies,
    findById: async () => null,
    upsertByLinkedinLink: async () => {
      throw new Error('Not implemented');
    },
    save: async () => {}
  };
}

describe('ListCompanies', () => {
  test('returns empty list when no companies exist', async () => {
    const useCase = new ListCompanies(mockCompanyRepo([]));
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });

  test('returns all companies as DTOs', async () => {
    const companies = [
      Company.create({
        name: 'GitHub',
        domainName: 'github.com',
        website: 'https://github.com',
        logoUrl: null,
        linkedinLink: null,
        businessType: BusinessType.PLATFORM,
        industry: Industry.SOFTWARE,
        stage: null
      }),
      Company.create({
        name: 'Stripe',
        domainName: 'stripe.com',
        website: 'https://stripe.com',
        logoUrl: null,
        linkedinLink: 'https://linkedin.com/company/stripe',
        businessType: BusinessType.B2B,
        industry: Industry.FINANCE,
        stage: CompanyStage.LATE_STAGE
      })
    ];

    const useCase = new ListCompanies(mockCompanyRepo(companies));
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('GitHub');
    expect(result[0].businessType).toBe(BusinessType.PLATFORM);
    expect(result[1].name).toBe('Stripe');
    expect(result[1].stage).toBe(CompanyStage.LATE_STAGE);
    expect(result[1].linkedinLink).toBe('https://linkedin.com/company/stripe');
  });
});
