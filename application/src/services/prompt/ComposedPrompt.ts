import type { PromptBlock } from './PromptBlock.js';

export type ComposedPromptMeta = {
  readonly scope: string;
  readonly profileId: string;
  readonly jobDescriptionId: string;
  readonly experienceId?: string;
  /** Shared generation run ID — all elements from the same generation share this. */
  readonly generationRunId: string;
};

export type ComposedPrompt = {
  readonly systemBlocks: PromptBlock[];
  readonly profileBlocks: PromptBlock[];
  readonly sessionBlocks: PromptBlock[];
  readonly requestBlocks: PromptBlock[];
  readonly model: string;
  /** Opaque output schema — used by the infrastructure generator for validation. */
  readonly outputSchema: unknown;
  /** Metadata for logging — scope, profile/JD/experience IDs. */
  readonly meta: ComposedPromptMeta;
};
