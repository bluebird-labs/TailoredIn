import type { CompanyDataProvider, CompanyEnrichmentResult } from '../../../src/ports/CompanyDataProvider.js';
import { EnrichCompanyData } from '../../../src/use-cases/company/EnrichCompanyData.js';

function mockProvider(result: CompanyEnrichmentResult): CompanyDataProvider {
  return {
    enrichFromUrl: jest.fn(async () => result)
  };
}

describe('EnrichCompanyData', () => {
  test('delegates to CompanyDataProvider and returns result', async () => {
    const enrichmentResult: CompanyEnrichmentResult = {
      name: 'GitHub',
      description: null,
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: null,
      industry: null,
      stage: null,
      status: null
    };

    const useCase = new EnrichCompanyData(mockProvider(enrichmentResult));
    const result = await useCase.execute({ url: 'https://github.com' });

    expect(result).toEqual(enrichmentResult);
  });

  test('returns nulls when provider cannot determine fields', async () => {
    const emptyResult: CompanyEnrichmentResult = {
      name: null,
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null,
      status: null
    };

    const useCase = new EnrichCompanyData(mockProvider(emptyResult));
    const result = await useCase.execute({ url: 'https://unknown-company.example' });

    expect(result.name).toBeNull();
    expect(result.website).toBeNull();
  });

  test('passes context to provider when provided', async () => {
    const enrichmentResult: CompanyEnrichmentResult = {
      name: 'Stripe',
      description: null,
      website: 'https://stripe.com',
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null,
      status: null
    };

    const provider = mockProvider(enrichmentResult);
    const useCase = new EnrichCompanyData(provider);
    await useCase.execute({ url: 'https://stripe.com', context: 'the fintech one in SF' });

    expect(provider.enrichFromUrl).toHaveBeenCalledWith('https://stripe.com', 'the fintech one in SF');
  });

  test('calls provider without context when not provided', async () => {
    const enrichmentResult: CompanyEnrichmentResult = {
      name: 'GitHub',
      description: null,
      website: 'https://github.com',
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null,
      status: null
    };

    const provider = mockProvider(enrichmentResult);
    const useCase = new EnrichCompanyData(provider);
    await useCase.execute({ url: 'https://github.com' });

    expect(provider.enrichFromUrl).toHaveBeenCalledWith('https://github.com', undefined);
  });
});
