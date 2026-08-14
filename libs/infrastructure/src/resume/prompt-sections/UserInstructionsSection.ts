import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class UserInstructionsSection extends PromptSection {
  public readonly name = 'user-instructions';
  public readonly cacheTier = CacheTier.REQUEST_VARIABLE;

  public render(context: GenerationContext): PromptBlock {
    if (!context.userInstructions) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    return {
      cacheTier: this.cacheTier,
      content: `## User Instructions (HIGHEST PRIORITY)

The user has provided the following instructions. They represent the user's specific intent for this content and they OVERRIDE the tone, voice, emphasis, and content-selection guidance given above wherever the two conflict - including any instruction to mirror the About section's voice. Do not fall back to the default style once the user has asked for something else. Only two things outrank these instructions: the hard length limits, and the no-invention / no-borrowing rules (never invent facts, never take facts from another experience). Everything else is theirs to direct.

${context.userInstructions}`
    };
  }
}
