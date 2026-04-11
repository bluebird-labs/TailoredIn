import type { PromptBlock } from './PromptBlock.js';

export type ComposedPrompt = {
  readonly systemBlocks: PromptBlock[];
  readonly profileBlocks: PromptBlock[];
  readonly sessionBlocks: PromptBlock[];
  readonly requestBlocks: PromptBlock[];
  readonly model: string;
};
