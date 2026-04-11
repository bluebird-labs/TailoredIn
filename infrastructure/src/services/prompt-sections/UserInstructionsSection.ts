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
      content: `## User Instructions (HIGH PRIORITY)

The user has provided the following instructions. Give these heavy weight in your generation - they represent the user's specific intent for this content. Follow them closely while still respecting the structural rules above (length limits, no invention, etc.).

${context.userInstructions}`
    };
  }
}
