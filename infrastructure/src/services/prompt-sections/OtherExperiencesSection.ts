import { PromptSection } from '@tailoredin/application';
import type { PromptBlock } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class OtherExperiencesSection extends PromptSection {
  public readonly name = 'other-experiences';
  public readonly cacheTier = CacheTier.REQUEST_VARIABLE;

  public render(context: GenerationContext): PromptBlock {
    const others = context.experiences.slice(1);
    if (others.length === 0) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const lines = [
      '## Other Experiences (for differentiation context only)',
      '',
      'The candidate also has these other experiences. Use them ONLY to avoid repetition and to understand career trajectory. Do NOT borrow facts from these.',
      ''
    ];

    for (const exp of others) {
      lines.push(`- ${exp.title} at ${exp.companyName} (${exp.startDate} - ${exp.endDate})`);
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
