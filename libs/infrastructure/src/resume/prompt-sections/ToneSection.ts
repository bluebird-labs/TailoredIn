import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
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

The following About section is the DEFAULT source for the candidate's voice, tone, and writing style - mirror their personality and communication style unless the user instructions say otherwise. Where the user instructions ask for a different tone, voice, or emphasis, follow the user instructions and set this default aside.

About:
${about}`
    };
  }
}
