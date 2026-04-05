import type { CompanyDataProvider, CompanyEnrichmentResult } from '../../ports/CompanyDataProvider.js';

export type EnrichCompanyDataInput = {
  url: string;
  context?: string;
};

export class EnrichCompanyData {
  public constructor(private readonly companyDataProvider: CompanyDataProvider) {}

  public async execute(input: EnrichCompanyDataInput): Promise<CompanyEnrichmentResult> {
    return this.companyDataProvider.enrichFromUrl(input.url, input.context);
  }
}
