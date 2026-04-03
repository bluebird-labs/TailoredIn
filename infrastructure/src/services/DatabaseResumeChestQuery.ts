import { inject, injectable } from '@needle-di/core';
import type { ResumeChestQuery } from '@tailoredin/application';
import type { ExperienceRepository } from '@tailoredin/domain';
import { DI } from '../DI.js';
import { formatDateRange } from '../resume/dateFormatter.js';

/**
 * Builds a rich markdown document of all experiences and their accomplishment narratives
 * for use as LLM input. The LLM reads these narratives and generates resume bullets.
 */
@injectable()
export class DatabaseResumeChestQuery implements ResumeChestQuery {
  public constructor(private readonly experienceRepo: ExperienceRepository = inject(DI.Experience.Repository)) {}

  public async makeChestMarkdown(_profileId: string): Promise<string> {
    const allExperiences = await this.experienceRepo.findAll();
    const lines: string[] = [];

    for (const exp of allExperiences) {
      lines.push(`## ${exp.title} @ ${exp.companyName}`);
      lines.push(`*${formatDateRange(exp.startDate, exp.endDate)} | ${exp.location}*`);
      lines.push(`experience_id: ${exp.id.value}`);

      if (exp.narrative) {
        lines.push('');
        lines.push('**Role Narrative:**');
        lines.push(exp.narrative);
      }

      if (exp.accomplishments.length > 0) {
        lines.push('');
        lines.push('**Accomplishments:**');
        for (const acc of exp.accomplishments) {
          lines.push(`### [${acc.id.value}] ${acc.title}`);
          if (acc.skillTags.length > 0) {
            lines.push(`*Tags: ${acc.skillTags.join(', ')}*`);
          }
          lines.push(acc.narrative);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}
