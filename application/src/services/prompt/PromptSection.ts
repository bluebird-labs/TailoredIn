import type { CacheTier, GenerationContext } from '@tailoredin/domain';
import type { PromptBlock } from './PromptBlock.js';

export abstract class PromptSection {
  public abstract readonly name: string;
  public abstract readonly cacheTier: CacheTier;

  public abstract render(context: GenerationContext): PromptBlock;
}
