import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';
import { inject, injectable } from '@needle-di/core';
import { Logger } from '@tailoredin/core';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DI } from '../../DI.js';
import { BaseLlmApiProvider } from './BaseLlmApiProvider.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

@injectable()
export class ClaudeApiProvider extends BaseLlmApiProvider {
  protected readonly log: LoggerInstance = Logger.create(this);
  protected readonly defaultModel = 'claude-sonnet-4-6';
  protected readonly providerName = 'claude-api';

  private _client: Anthropic | undefined;

  public constructor(private readonly apiKey: string = inject(DI.Llm.ClaudeApiKey)) {
    super();
  }

  // Protected to allow test subclasses to inject a mock client
  protected getClient(): Anthropic {
    this._client ??= new Anthropic({
      apiKey: this.apiKey,
      maxRetries: 0 // BaseLlmApiProvider owns the retry loop
    });
    return this._client;
  }

  protected async callApi<T extends z.ZodObject<z.ZodRawShape>>(
    prompt: string,
    schema: T,
    model: string,
    maxTokens: number,
    timeoutMs: number
  ): Promise<z.infer<T>> {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: zodToJsonSchema return type doesn't match SDK's JsonSchema type
      const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' }) as any;
      const message = await this.getClient().messages.parse(
        {
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
          output_config: { format: jsonSchemaOutputFormat(jsonSchema) }
        },
        { timeout: timeoutMs }
      );
      return message.parsed_output as z.infer<T>;
    } catch (e) {
      if (e instanceof Anthropic.APIConnectionTimeoutError) throw new Error(`API call timed out after ${timeoutMs}ms`);
      if (e instanceof Anthropic.RateLimitError) throw new Error('API rate limit exceeded: 429');
      if (e instanceof Anthropic.InternalServerError && e.status === 529)
        throw new Error('API service overloaded (529)');
      if (e instanceof Anthropic.InternalServerError) throw new Error(`API server error (${e.status}): ${e.message}`);
      if (e instanceof Anthropic.APIConnectionError) throw new Error(`API connection failed: ${e.message}`);
      throw e;
    }
  }
}
