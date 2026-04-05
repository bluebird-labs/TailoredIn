import type { CompanySearchProvider, CompanySearchResult } from '../../ports/CompanySearchProvider.js';

export type SearchCompaniesInput = {
  name: string;
  description?: string;
};

export class SearchCompanies {
  public constructor(private readonly searchProvider: CompanySearchProvider) {}

  public async execute(input: SearchCompaniesInput): Promise<CompanySearchResult[]> {
    return this.searchProvider.searchByName(input.name, input.description);
  }
}
