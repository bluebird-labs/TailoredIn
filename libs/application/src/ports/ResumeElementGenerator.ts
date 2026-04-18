import type { ComposedPrompt } from '../services/prompt/ComposedPrompt.js';

export interface ResumeElementGenerator {
  generate(composedPrompt: ComposedPrompt): Promise<unknown>;
}
