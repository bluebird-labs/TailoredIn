import { CacheTier, type GenerationContext, type GenerationScope } from '@tailoredin/domain';
import type { ComposedPrompt } from './ComposedPrompt.js';
import type { PromptBlock } from './PromptBlock.js';
import type { PromptSection } from './PromptSection.js';

export class ScopeRecipe {
  public constructor(
    public readonly scope: GenerationScope,
    public readonly sections: PromptSection[],
    public readonly model: string,
    /** Opaque output schema — passed through to ComposedPrompt for infrastructure validation. */
    public readonly outputSchema: unknown
  ) {}

  public compose(context: GenerationContext): ComposedPrompt {
    const systemBlocks: PromptBlock[] = [];
    const profileBlocks: PromptBlock[] = [];
    const sessionBlocks: PromptBlock[] = [];
    const requestBlocks: PromptBlock[] = [];

    for (const section of this.sections) {
      const block = section.render(context);
      if (!block.content) continue;

      switch (block.cacheTier) {
        case CacheTier.SYSTEM_STABLE:
          systemBlocks.push(block);
          break;
        case CacheTier.PROFILE_STABLE:
          profileBlocks.push(block);
          break;
        case CacheTier.SESSION_STABLE:
          sessionBlocks.push(block);
          break;
        case CacheTier.REQUEST_VARIABLE:
          requestBlocks.push(block);
          break;
      }
    }

    return {
      systemBlocks,
      profileBlocks,
      sessionBlocks,
      requestBlocks,
      model: this.model,
      outputSchema: this.outputSchema
    };
  }
}
