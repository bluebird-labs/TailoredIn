import { PromptSection } from '@tailoredin/application';
import type { PromptBlock } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class EducationSection extends PromptSection {
  public readonly name = 'education';
  public readonly cacheTier = CacheTier.PROFILE_STABLE;

  public render(context: GenerationContext): PromptBlock {
    if (context.education.length === 0) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const lines = ['## Education', ''];
    for (const edu of context.education) {
      const parts = [`${edu.degreeTitle} — ${edu.institutionName} (${edu.graduationYear})`];
      if (edu.honors) parts.push(`Honors: ${edu.honors}`);
      lines.push(parts.join('\n'));
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
