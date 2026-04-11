import { CacheTier, type GenerationContext, type GenerationScope } from '@tailoredin/domain';
import type { ComposedPrompt } from './ComposedPrompt.js';
import type { PromptBlock } from './PromptBlock.js';
import type { PromptSection } from './PromptSection.js';

export class ScopeRecipe {
  public constructor(
    public readonly scope: GenerationScope,
    public readonly sections: PromptSection[],
    public readonly model: string,
    /** Opaque output schema or factory — passed through to ComposedPrompt for infrastructure validation. */
    private readonly outputSchemaOrFactory: unknown | ((context: GenerationContext) => unknown)
  ) {}

  public compose(context: GenerationContext, generationRunId?: string): ComposedPrompt {
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
      outputSchema:
        typeof this.outputSchemaOrFactory === 'function'
          ? (this.outputSchemaOrFactory as (ctx: GenerationContext) => unknown)(context)
          : this.outputSchemaOrFactory,
      meta: {
        scope: this.scope,
        profileId: context.profile.id,
        jobDescriptionId: context.jobDescription.id,
        experienceId: context.experiences[0]?.id,
        generationRunId: generationRunId ?? new Date().toISOString().replace(/[:.]/g, '-')
      }
    };
  }
}
