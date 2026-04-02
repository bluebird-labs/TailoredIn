import type { z } from 'zod';

export enum LlmProviderKey {
  MOCK = 'MOCK',
  CLAUDE_CLI = 'CLAUDE_CLI'
}

export interface StructuredLlmRequest<TInput extends z.ZodType, TOutput extends z.ZodType> {
  prompt: string;
  inputSchema: TInput;
  outputSchema: TOutput;
  context: z.infer<TInput>;
  provider: LlmProviderKey;
}

export interface StructuredLlmClient {
  generate<TInput extends z.ZodType, TOutput extends z.ZodType>(
    request: StructuredLlmRequest<TInput, TOutput>
  ): Promise<z.infer<TOutput>>;
}
