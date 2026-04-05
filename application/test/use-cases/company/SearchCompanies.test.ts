import { describe, expect, mock, test } from 'bun:test';
import type { CompanySearchProvider, CompanySearchResult } from '../../../src/ports/CompanySearchProvider.js';
import { SearchCompanies } from '../../../src/use-cases/company/SearchCompanies.js';

function mockProvider(results: CompanySearchResult[]): CompanySearchProvider {
  return {
    searchByName: mock(async () => results)
  };
}

describe('SearchCompanies', () => {
  test('delegates to CompanySearchProvider and returns results', async () => {
    const results: CompanySearchResult[] = [
      { name: 'Stripe', website: 'https://stripe.com', description: 'Online payment processing' },
      { name: 'Stripe (India)', website: 'https://stripe.com/in', description: 'Stripe India subsidiary' }
    ];

    const provider = mockProvider(results);
    const useCase = new SearchCompanies(provider);
    const output = await useCase.execute({ name: 'Stripe' });

    expect(output).toEqual(results);
    expect(provider.searchByName).toHaveBeenCalledWith('Stripe');
  });

  test('returns empty array when no matches', async () => {
    const provider = mockProvider([]);
    const useCase = new SearchCompanies(provider);
    const output = await useCase.execute({ name: 'xyznonexistent' });

    expect(output).toEqual([]);
  });
});
