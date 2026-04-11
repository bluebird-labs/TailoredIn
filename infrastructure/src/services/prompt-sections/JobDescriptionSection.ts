import { PromptSection } from '@tailoredin/application';
import type { PromptBlock } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class JobDescriptionSection extends PromptSection {
  public readonly name = 'job-description';
  public readonly cacheTier = CacheTier.REQUEST_VARIABLE;

  public render(context: GenerationContext): PromptBlock {
    const { jobDescription: jd } = context;
    const lines = [
      '## Target Job Description',
      '',
      `Title: ${jd.title}`,
      '',
      `Description:`,
      jd.description
    ];

    if (jd.rawText) {
      lines.push('', 'Raw Text:', jd.rawText);
    }

    if (jd.level) {
      lines.push('', `Level: ${jd.level}`);
    }

    if (jd.soughtHardSkills.length > 0) {
      lines.push('', `Hard Skills Sought: ${jd.soughtHardSkills.join(', ')}`);
    }

    if (jd.soughtSoftSkills.length > 0) {
      lines.push('', `Soft Skills Sought: ${jd.soughtSoftSkills.join(', ')}`);
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
