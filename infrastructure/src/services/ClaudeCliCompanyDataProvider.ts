import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inject, injectable } from '@needle-di/core';
import type { CompanyDataProvider, CompanyEnrichmentResult } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import { z } from 'zod';
import { DI } from '../DI.js';
import type { ClaudeCliProvider } from './llm/ClaudeCliProvider.js';
import { LlmJsonRequest } from './llm/LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dir, 'prompts/enrich-company.md');

const companyEnrichmentSchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  website: z.string().url().nullable(),
  linkedinLink: z
    .string()
    .regex(/^https:\/\/(www\.)?linkedin\.com\/company\/.+/)
    .nullable(),
  logoUrl: z.string().url().nullable(),
  businessType: z.enum(Object.values(BusinessType) as [string, ...string[]]).nullable(),
  industry: z.enum(Object.values(Industry) as [string, ...string[]]).nullable(),
  stage: z.enum(Object.values(CompanyStage) as [string, ...string[]]).nullable()
});

class CompanyEnrichmentRequest extends LlmJsonRequest<typeof companyEnrichmentSchema> {
  public readonly schema = companyEnrichmentSchema;

  public constructor(
    private readonly url: string,
    private readonly context?: string
  ) {
    super();
  }

  public get prompt(): string {
    const template = readFileSync(PROMPT_PATH, 'utf-8');

    let prompt = template.replace('{{url}}', this.url);

    if (this.context) {
      prompt = prompt.replace('{{#context}}\n', '').replace('{{/context}}', '');
      prompt = prompt.replace('{{context}}', this.context);
    } else {
      prompt = prompt.replace(/\{\{#context\}\}[\s\S]*?\{\{\/context\}\}/g, '');
    }

    return prompt;
  }
}

@injectable()
export class ClaudeCliCompanyDataProvider implements CompanyDataProvider {
  private readonly log = Logger.create(this);

  public constructor(private readonly provider: ClaudeCliProvider = inject(DI.Llm.ClaudeCliProvider)) {}

  public async enrichFromUrl(url: string, context?: string): Promise<CompanyEnrichmentResult> {
    this.log.info(`Enriching company data for URL: "${url}"`);

    const startTime = Date.now();
    const result = await this.provider.request(new CompanyEnrichmentRequest(url, context));
    const duration = Date.now() - startTime;

    if (result.isErr) {
      const exitCode = result.error.exitCode ?? 'unknown';
      this.log.error(
        `Company enrichment failed | url="${url}" exitCode=${exitCode} duration=${duration}ms error="${result.error.message}"`
      );
      throw new ExternalServiceError('Claude CLI', 'Company enrichment failed');
    }

    const enrichment: CompanyEnrichmentResult = {
      ...result.value,
      website: this.normalizeUrl(result.value.website),
      linkedinLink: this.normalizeUrl(result.value.linkedinLink),
      logoUrl: result.value.logoUrl,
      businessType: result.value.businessType as BusinessType | null,
      industry: result.value.industry as Industry | null,
      stage: result.value.stage as CompanyStage | null
    };

    const enriched = await this.applyLogo(enrichment);
    this.log.info(`Company enrichment completed | url="${url}" name="${enriched.name}" duration=${duration}ms`);
    return enriched;
  }

  private async applyLogo(result: CompanyEnrichmentResult): Promise<CompanyEnrichmentResult> {
    if (result.logoUrl) {
      this.log.debug(`Using LLM-provided logo URL: "${result.logoUrl}"`);
      return result;
    }

    const websiteUrl = result.website;
    if (!websiteUrl) return result;

    let domain: string;
    try {
      domain = new URL(websiteUrl).hostname;
    } catch {
      this.log.debug(`Cannot extract domain from website URL: "${websiteUrl}"`);
      return result;
    }

    const providers = [
      { name: 'Hunter', url: `https://logos.hunter.io/${domain}` },
      { name: 'CompanyEnrich', url: `https://companyenrich.com/api/logo/${domain}` }
    ];

    for (const provider of providers) {
      this.log.debug(`Trying logo provider ${provider.name} for domain "${domain}"`);
      const isImage = await this.urlReturnsImage(provider.url);
      if (isImage) {
        this.log.debug(`Logo found via ${provider.name}: "${provider.url}"`);
        return { ...result, logoUrl: provider.url };
      }
    }

    this.log.debug(`No logo found for domain "${domain}" from any provider`);
    return result;
  }

  private normalizeUrl(url: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  private async urlReturnsImage(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
      const contentType = response.headers.get('content-type') ?? '';
      return response.ok && contentType.startsWith('image/');
    } catch {
      return false;
    }
  }
}
