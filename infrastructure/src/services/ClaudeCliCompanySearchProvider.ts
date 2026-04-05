import { inject, injectable } from '@needle-di/core';
import type { CompanySearchProvider, CompanySearchResult } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { z } from 'zod';
import { DI } from '../DI.js';
import type { ClaudeCliProvider } from './llm/ClaudeCliProvider.js';
import { LlmJsonRequest } from './llm/LlmJsonRequest.js';

const companySearchSchema = z.object({
  companies: z
    .array(
      z.object({
        name: z.string(),
        website: z.string().nullable(),
        description: z.string().nullable()
      })
    )
    .max(3)
});

class CompanySearchRequest extends LlmJsonRequest<typeof companySearchSchema> {
  public readonly schema = companySearchSchema;

  public constructor(private readonly name: string) {
    super();
  }

  public get prompt(): string {
    return [
      `Given this company name: "${this.name}"`,
      'Find the top 3 real companies that best match this name.',
      'Order by likelihood of match (best match first).'
    ].join('\n');
  }
}

@injectable()
export class ClaudeCliCompanySearchProvider implements CompanySearchProvider {
  private readonly log = Logger.create(this);

  public constructor(private readonly provider: ClaudeCliProvider = inject(DI.Llm.ClaudeCliProvider)) {}

  public async searchByName(name: string): Promise<CompanySearchResult[]> {
    this.log.info(`Searching companies by name: "${name}"`);

    const result = await this.provider.request(new CompanySearchRequest(name));

    if (result.isErr) {
      this.log.error(`Company search failed | name="${name}" error="${result.error.message}"`);
      throw new ExternalServiceError('Claude CLI', 'Company search failed');
    }

    const companies = result.value.companies;
    this.log.info(`Company search completed | name="${name}" results=${companies.length}`);
    return companies;
  }
}
