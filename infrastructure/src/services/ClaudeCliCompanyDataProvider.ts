import { injectable } from '@needle-di/core';
import { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import type { CompanyDataProvider, CompanyEnrichmentResult } from '@tailoredin/application';
import { EnumUtil, Logger } from '@tailoredin/core';

@injectable()
export class ClaudeCliCompanyDataProvider implements CompanyDataProvider {
  private readonly log = Logger.create(this);

  public async enrichFromUrl(url: string): Promise<CompanyEnrichmentResult> {
    const prompt = this.buildPrompt(url);

    this.log.info(`Enriching company data for URL: ${url}`);

    const proc = Bun.spawn(['claude', '-p', prompt, '--output-format', 'json'], {
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
    const text = parsed.result ?? output;

    return this.parseResponse(text);
  }

  public parseResponse(raw: string): CompanyEnrichmentResult {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    return {
      name: typeof data.name === 'string' ? data.name : null,
      website: typeof data.website === 'string' ? data.website : null,
      logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : null,
      linkedinLink: typeof data.linkedinLink === 'string' ? data.linkedinLink : null,
      businessType: typeof data.businessType === 'string' && EnumUtil.is(data.businessType, BusinessType) ? data.businessType : null,
      industry: typeof data.industry === 'string' && EnumUtil.is(data.industry, Industry) ? data.industry : null,
      stage: typeof data.stage === 'string' && EnumUtil.is(data.stage, CompanyStage) ? data.stage : null
    };
  }

  private buildPrompt(url: string): string {
    const businessTypes = Object.values(BusinessType).join(', ');
    const industries = Object.values(Industry).join(', ');
    const stages = Object.values(CompanyStage).join(', ');

    return [
      `Given this URL: ${url}`,
      'Look up or infer information about this company.',
      'Return ONLY a valid JSON object with these fields:',
      '- name (string or null): the company name',
      '- website (string or null): the company website URL',
      '- logoUrl (string or null): a URL to the company logo image',
      '- linkedinLink (string or null): the LinkedIn company page URL',
      `- businessType (one of: ${businessTypes}, or null): the business model`,
      `- industry (one of: ${industries}, or null): the industry`,
      `- stage (one of: ${stages}, or null): the funding/company stage`,
      'Use null for any field you are not confident about.',
      'Return ONLY the JSON object, no other text.'
    ].join('\n');
  }
}
