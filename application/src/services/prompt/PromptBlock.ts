import type { CacheTier } from '@tailoredin/domain';

export type PromptBlock = {
  readonly content: string;
  readonly cacheTier: CacheTier;
};
