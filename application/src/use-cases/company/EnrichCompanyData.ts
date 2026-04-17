import { Inject, Injectable } from '@nestjs/common';
import { DI } from '../../DI.js';
import type { CompanyDataProvider, CompanyEnrichmentResult } from '../../ports/CompanyDataProvider.js';

export type EnrichCompanyDataInput = {
  url: string;
  context?: string;
};

@Injectable()
export class EnrichCompanyData {
  public constructor(@Inject(DI.Company.DataProvider) private readonly companyDataProvider: CompanyDataProvider) {}

  public async execute(input: EnrichCompanyDataInput): Promise<CompanyEnrichmentResult> {
    return this.companyDataProvider.enrichFromUrl(input.url, input.context);
  }
}
