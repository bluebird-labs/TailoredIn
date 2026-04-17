import { Inject, Injectable } from '@nestjs/common';
import type { CompanyDiscoveryProvider, CompanyDiscoveryResult } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { z } from 'zod';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from '../llm/ClaudeApiProvider.js';
import { LlmJsonRequest } from '../llm/LlmJsonRequest.js';

const companyDiscoverySchema = z.object({
  companies: z
    .array(
      z.object({
        name: z.string(),
        website: z.string().url().nullable(),
        description: z.string().nullable()
      })
    )
    .max(3)
});

class CompanyDiscoveryRequest extends LlmJsonRequest<typeof companyDiscoverySchema> {
  public readonly schema = companyDiscoverySchema;

  public constructor(private readonly query: string) {
    super();
  }

  public getInput(): Record<string, unknown> {
    return { query: this.query };
  }

  public get prompt(): string {
    const lines = [
      `Given this query: "${this.query}"`,
      'Find between 0 and 3 real companies that best match this query.',
      'The query may be a company name or a website URL.',
      'Return only companies you are confident actually exist. If uncertain, return fewer results or an empty list.',
      'Order by likelihood of match (best match first).'
    ];
    return lines.join('\n') + this.buildValidationErrorsSuffix();
  }
}

@Injectable()
export class ClaudeApiCompanyDiscoveryProvider implements CompanyDiscoveryProvider {
  private readonly log = Logger.create(this);

  public constructor(@Inject(DI.Llm.ClaudeApiProvider) private readonly provider: ClaudeApiProvider) {}

  public async discover(query: string): Promise<CompanyDiscoveryResult[]> {
    this.log.info(`Discovering companies for query: "${query}"`);

    const result = await this.provider.request(new CompanyDiscoveryRequest(query));

    if (result.isErr) {
      this.log.error(`Company discovery failed | query="${query}" error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', `Company discovery failed: ${result.error.message}`);
    }

    const companies = result.value.companies;
    this.log.info(`Company discovery completed | query="${query}" results=${companies.length}`);
    return companies;
  }
}
