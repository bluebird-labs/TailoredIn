import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

const MAX_ACCOMPLISHMENTS_PER_EXPERIENCE = 3;

export class CareerTimelineSection extends PromptSection {
  public readonly name = 'career-timeline';
  public readonly cacheTier = CacheTier.PROFILE_STABLE;

  public render(context: GenerationContext): PromptBlock {
    if (context.experiences.length === 0) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const lines = [
      '## Career Timeline',
      '',
      'Use this data to select the headline title, compute years of experience, and identify key metrics and domain expertise.',
      ''
    ];

    for (const exp of context.experiences) {
      lines.push(`### ${exp.title} at ${exp.companyName} (${exp.startDate} - ${exp.endDate})`);

      const company = context.companies.find(c => c.id === exp.companyId);
      if (company) {
        const meta: string[] = [];
        meta.push(`Industry: ${company.industry}`);
        meta.push(`Stage: ${company.stage}`);
        lines.push(meta.join(' | '));
      }

      const topAccomplishments = exp.accomplishments.slice(0, MAX_ACCOMPLISHMENTS_PER_EXPERIENCE);
      if (topAccomplishments.length > 0) {
        lines.push('Key accomplishments:');
        for (const acc of topAccomplishments) {
          lines.push(`- ${acc.title}: ${acc.narrative}`);
        }
      }

      lines.push('');
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
