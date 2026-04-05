import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { injectable } from '@needle-di/core';
import type { CompanyDataProvider, CompanyEnrichmentResult } from '@tailoredin/application';
import { EnumUtil, Logger } from '@tailoredin/core';
import { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import { stripCodeFences } from './strip-code-fences.js';

const PROMPT_PATH = resolve(import.meta.dir, 'prompts/enrich-company.md');

@injectable()
export class ClaudeCliCompanyDataProvider implements CompanyDataProvider {
  private readonly log = Logger.create(this);

  public async enrichFromUrl(url: string, context?: string): Promise<CompanyEnrichmentResult> {
    const prompt = this.buildPrompt(url, context);

    this.log.info(`Enriching company data for URL: ${url}`);

    const jsonSchema = JSON.stringify(this.buildSchema());

    const proc = Bun.spawn(['claude', '-p', prompt, '--output-format', 'json', '--json-schema', jsonSchema], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      this.log.error(`Claude CLI failed (exit ${exitCode}): ${stderr}`);
      throw new Error(`Claude CLI failed with exit code ${exitCode}`);
    }

    const parsed = JSON.parse(output);
    const text = stripCodeFences(parsed.result ?? output);

    const result = this.parseResponse(text);
    const validated = await this.validateUrls(result);
    return this.applyLogoFromDomain(validated);
  }

  public parseResponse(raw: string): CompanyEnrichmentResult {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return {
      name: typeof data.name === 'string' ? data.name : null,
      description: typeof data.description === 'string' ? data.description : null,
      website: typeof data.website === 'string' ? data.website : null,
      logoUrl: null,
      linkedinLink: typeof data.linkedinLink === 'string' ? data.linkedinLink : null,
      businessType:
        typeof data.businessType === 'string' && EnumUtil.is(data.businessType, BusinessType)
          ? data.businessType
          : null,
      industry: typeof data.industry === 'string' && EnumUtil.is(data.industry, Industry) ? data.industry : null,
      stage: typeof data.stage === 'string' && EnumUtil.is(data.stage, CompanyStage) ? data.stage : null
    };
  }

  private async validateUrls(result: CompanyEnrichmentResult): Promise<CompanyEnrichmentResult> {
    const websiteUrl = this.normalizeUrl(result.website);
    const linkedinUrl = this.normalizeUrl(result.linkedinLink);

    const [websiteOk, linkedinOk] = await Promise.all([
      websiteUrl ? this.urlExists(websiteUrl) : false,
      linkedinUrl ? this.urlExists(linkedinUrl) : false
    ]);

    return {
      ...result,
      website: websiteOk ? websiteUrl : null,
      linkedinLink: linkedinOk ? linkedinUrl : null
    };
  }

  private async applyLogoFromDomain(result: CompanyEnrichmentResult): Promise<CompanyEnrichmentResult> {
    const websiteUrl = result.website;
    if (!websiteUrl) return result;

    try {
      const domain = new URL(websiteUrl).hostname;
      const logoUrl = `https://logos.hunter.io/${domain}`;
      const exists = await this.urlExists(logoUrl);
      return { ...result, logoUrl: exists ? logoUrl : null };
    } catch {
      return result;
    }
  }

  private normalizeUrl(url: string | null): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  private async urlExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildSchema(): object {
    return {
      type: 'object',
      properties: {
        name: { type: ['string', 'null'] },
        description: { type: ['string', 'null'] },
        website: { type: ['string', 'null'] },
        linkedinLink: { type: ['string', 'null'] },
        businessType: { enum: [...Object.values(BusinessType), null] },
        industry: { enum: [...Object.values(Industry), null] },
        stage: { enum: [...Object.values(CompanyStage), null] }
      }
    };
  }

  private buildPrompt(url: string, context?: string): string {
    const template = readFileSync(PROMPT_PATH, 'utf-8');
    const businessTypes = Object.values(BusinessType).join(', ');
    const industries = Object.values(Industry).join(', ');
    const stages = Object.values(CompanyStage).join(', ');

    let prompt = template
      .replace('{{url}}', url)
      .replace('{{businessTypes}}', businessTypes)
      .replace('{{industries}}', industries)
      .replace('{{stages}}', stages);

    if (context) {
      prompt = prompt.replace('{{#context}}\n', '').replace('{{/context}}', '');
      prompt = prompt.replace('{{context}}', context);
    } else {
      prompt = prompt.replace(/\{\{#context\}\}[\s\S]*?\{\{\/context\}\}/g, '');
    }

    return prompt;
  }
}
