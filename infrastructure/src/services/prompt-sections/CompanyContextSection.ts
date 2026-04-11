import { PromptSection } from '@tailoredin/application';
import type { PromptBlock } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class CompanyContextSection extends PromptSection {
  public readonly name = 'company-context';
  public readonly cacheTier = CacheTier.PROFILE_STABLE;

  public render(context: GenerationContext): PromptBlock {
    if (context.companies.length === 0) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const target = context.experiences[0];
    if (!target?.companyId) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const company = context.companies.find(c => c.id === target.companyId);
    if (!company) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const lines = [
      '## Company Context',
      '',
      `Company: ${company.name}`,
      `Industry: ${company.industry}`,
      `Stage: ${company.stage}`,
      `Business Type: ${company.businessType}`
    ];

    if (company.description) {
      lines.push('', `Description: ${company.description}`);
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
