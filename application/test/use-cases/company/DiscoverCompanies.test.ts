import type { CompanyDiscoveryProvider, CompanyDiscoveryResult } from '../../../src/ports/CompanyDiscoveryProvider.js';
import { DiscoverCompanies } from '../../../src/use-cases/company/DiscoverCompanies.js';

function mockProvider(results: CompanyDiscoveryResult[]): CompanyDiscoveryProvider {
  return {
    discover: jest.fn(async () => results)
  };
}

describe('DiscoverCompanies', () => {
  test('delegates to CompanyDiscoveryProvider and returns results', async () => {
    const results: CompanyDiscoveryResult[] = [
      { name: 'Stripe', website: 'https://stripe.com', description: 'Online payment processing' },
      { name: 'Stripe Atlas', website: 'https://stripe.com/atlas', description: 'Business incorporation' }
    ];

    const provider = mockProvider(results);
    const useCase = new DiscoverCompanies(provider);
    const output = await useCase.execute({ query: 'Stripe' });

    expect(output).toEqual(results);
    expect(provider.discover).toHaveBeenCalledWith('Stripe');
  });

  test('passes URL query to provider', async () => {
    const results: CompanyDiscoveryResult[] = [
      { name: 'Stripe', website: 'https://stripe.com', description: 'Online payment processing' }
    ];

    const provider = mockProvider(results);
    const useCase = new DiscoverCompanies(provider);
    const output = await useCase.execute({ query: 'https://stripe.com' });

    expect(output).toEqual(results);
    expect(provider.discover).toHaveBeenCalledWith('https://stripe.com');
  });

  test('returns empty array when no matches', async () => {
    const provider = mockProvider([]);
    const useCase = new DiscoverCompanies(provider);
    const output = await useCase.execute({ query: 'xyznonexistent' });

    expect(output).toEqual([]);
  });
});
