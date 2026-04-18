import { Inject, Injectable } from '@nestjs/common';
import { DI } from '../../DI.js';
import type { CompanyDiscoveryProvider, CompanyDiscoveryResult } from '../../ports/CompanyDiscoveryProvider.js';

export type DiscoverCompaniesInput = {
  query: string;
};

@Injectable()
export class DiscoverCompanies {
  public constructor(
    @Inject(DI.Company.DiscoveryProvider) private readonly discoveryProvider: CompanyDiscoveryProvider
  ) {}

  public async execute(input: DiscoverCompaniesInput): Promise<CompanyDiscoveryResult[]> {
    return this.discoveryProvider.discover(input.query);
  }
}
