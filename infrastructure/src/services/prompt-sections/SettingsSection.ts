import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext, GenerationScope } from '@tailoredin/domain';

export class SettingsSection extends PromptSection {
  public readonly name = 'settings';
  public readonly cacheTier = CacheTier.SESSION_STABLE;

  public render(context: GenerationContext): PromptBlock {
    const lines: string[] = [];

    const resumePrompt = context.settings.adminPrompts.get(GenerationScope.RESUME);
    if (resumePrompt) {
      lines.push('## Admin Instructions (Resume-Wide)', '', resumePrompt);
    }

    const headlinePrompt = context.settings.adminPrompts.get(GenerationScope.HEADLINE);
    if (headlinePrompt) {
      lines.push('', '## Admin Instructions (Headline)', '', headlinePrompt);
    }

    const experiencePrompt = context.settings.adminPrompts.get(GenerationScope.EXPERIENCE);
    if (experiencePrompt) {
      lines.push('', '## Admin Instructions (Experience)', '', experiencePrompt);
    }

    if (lines.length === 0) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
