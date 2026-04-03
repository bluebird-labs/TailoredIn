import { inject, injectable } from '@needle-di/core';
import type { ResumeChestQuery } from '@tailoredin/application';
import type { ExperienceRepository } from '@tailoredin/domain';
import { DI } from '../DI.js';
import { formatDateRange } from '../resume/dateFormatter.js';

/**
 * Builds a rich markdown document of ALL non-archived experiences + bullets for use as LLM input.
 * Includes verbose descriptions when available so the LLM can generate targeted bullet texts.
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
        lines.push('**Narrative:**');
        lines.push(exp.narrative);
      }

      if (exp.summary) {
        lines.push('');
        lines.push(`**Summary:** ${exp.summary}`);
      }

      const activeBullets = exp.bullets.filter(b => b.status !== 'archived');
      if (activeBullets.length > 0) {
        lines.push('');
        lines.push('**Bullets:**');
        for (const bullet of activeBullets) {
          const statusLabel = bullet.status === 'experimental' ? ' *(experimental)*' : '';
          lines.push(`- [${bullet.id.value}]${statusLabel} ${bullet.content}`);
          if (bullet.verboseDescription) {
            lines.push(`  *Verbose:* ${bullet.verboseDescription}`);
          }
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}
