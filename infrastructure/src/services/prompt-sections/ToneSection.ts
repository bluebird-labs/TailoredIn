import { PromptSection } from '@tailoredin/application';
import type { PromptBlock } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class ToneSection extends PromptSection {
  public readonly name = 'tone';
  public readonly cacheTier = CacheTier.PROFILE_STABLE;

  public render(context: GenerationContext): PromptBlock {
    const about = context.profile.about;
    if (!about) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    return {
      cacheTier: this.cacheTier,
      content: `## Tone & Voice

Derive the candidate's voice, tone, and writing style from the following About section. Mirror their personality and communication style in all generated content.

About:
${about}`
    };
  }
}
