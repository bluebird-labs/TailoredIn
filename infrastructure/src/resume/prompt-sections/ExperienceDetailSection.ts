import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class ExperienceDetailSection extends PromptSection {
  public readonly name = 'experience-detail';
  public readonly cacheTier = CacheTier.REQUEST_VARIABLE;

  public render(context: GenerationContext): PromptBlock {
    const target = context.experiences[0];
    if (!target) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const lines = [
      '## Target Experience',
      '',
      `### Experience ID: ${target.id}`,
      `Role: ${target.title} at ${target.companyName}`,
      `Dates: ${target.startDate} - ${target.endDate}`,
      `Location: ${target.location}`
    ];

    if (target.summary) {
      lines.push('', `Summary: ${target.summary}`);
    }

    if (target.accomplishments.length > 0) {
      lines.push('', 'Accomplishments:');
      for (const acc of target.accomplishments) {
        const narrative = acc.narrative ? `: ${acc.narrative}` : '';
        lines.push(`- ${acc.title}${narrative}`);
      }
    }

    if (target.bulletMin === target.bulletMax) {
      lines.push(
        '',
        `IMPORTANT: Generate EXACTLY ${target.bulletMin} bullet(s) for this experience. No more, no fewer.`
      );
    } else {
      lines.push(
        '',
        `IMPORTANT: Generate between ${target.bulletMin} and ${target.bulletMax} bullets for this experience. Aim for ${Math.round((target.bulletMin + target.bulletMax) / 2)}.`
      );
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
