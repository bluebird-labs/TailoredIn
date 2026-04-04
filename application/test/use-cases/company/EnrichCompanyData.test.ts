import { describe, expect, test } from 'bun:test';
import type { CompanyDataProvider, CompanyEnrichmentResult } from '../../../src/ports/CompanyDataProvider.js';
import { EnrichCompanyData } from '../../../src/use-cases/company/EnrichCompanyData.js';

function mockProvider(result: CompanyEnrichmentResult): CompanyDataProvider {
  return {
    enrichFromUrl: async () => result
  };
}

describe('EnrichCompanyData', () => {
  test('delegates to CompanyDataProvider and returns result', async () => {
    const enrichmentResult: CompanyEnrichmentResult = {
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: 'https://logo.com/gh.png',
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: null,
      industry: null,
      stage: null
    };

    const useCase = new EnrichCompanyData(mockProvider(enrichmentResult));
    const result = await useCase.execute({ url: 'https://github.com' });

    expect(result).toEqual(enrichmentResult);
  });

  test('returns nulls when provider cannot determine fields', async () => {
    const emptyResult: CompanyEnrichmentResult = {
      name: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    };

    const useCase = new EnrichCompanyData(mockProvider(emptyResult));
    const result = await useCase.execute({ url: 'https://unknown-company.example' });

    expect(result.name).toBeNull();
    expect(result.website).toBeNull();
  });
});
