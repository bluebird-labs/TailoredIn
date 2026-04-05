import type { CompanyDiscoveryProvider, CompanyDiscoveryResult } from '../../ports/CompanyDiscoveryProvider.js';

export type DiscoverCompaniesInput = {
  query: string;
};

export class DiscoverCompanies {
  public constructor(private readonly discoveryProvider: CompanyDiscoveryProvider) {}

  public async execute(input: DiscoverCompaniesInput): Promise<CompanyDiscoveryResult[]> {
    return this.discoveryProvider.discover(input.query);
  }
}
