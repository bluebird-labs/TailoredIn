import { injectable } from '@needle-di/core';
import { LlmProviderKey, type StructuredLlmClient, type StructuredLlmRequest } from '@tailoredin/application';
import type { z } from 'zod';
import { ClaudeCliLlmProvider } from './ClaudeCliLlmProvider.js';
import type { LlmProviderBackend } from './LlmProviderBackend.js';
import { MockLlmProvider } from './MockLlmProvider.js';

@injectable()
export class StructuredLlmRouter implements StructuredLlmClient {
  private readonly providers: Map<LlmProviderKey, LlmProviderBackend>;

  public constructor() {
    this.providers = new Map<LlmProviderKey, LlmProviderBackend>([
      [LlmProviderKey.MOCK, new MockLlmProvider()],
      [LlmProviderKey.CLAUDE_CLI, new ClaudeCliLlmProvider()]
    ]);
  }

  public async generate<TInput extends z.ZodType, TOutput extends z.ZodType>(
    request: StructuredLlmRequest<TInput, TOutput>
  ): Promise<z.infer<TOutput>> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Unknown LLM provider: ${request.provider}`);
    }
    return provider.generate(request);
  }
}
