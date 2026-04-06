import Anthropic from '@anthropic-ai/sdk';
import { inject, injectable } from '@needle-di/core';
import { Logger } from '@tailoredin/core';
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

  protected async callApi(
    prompt: string,
    jsonSchema: string,
    model: string,
    maxTokens: number,
    timeoutMs: number
  ): Promise<string> {
    const systemPrompt = [
      'You must respond with valid JSON that conforms exactly to this JSON schema:',
      '',
      jsonSchema,
      '',
      'Return ONLY the JSON object. No markdown code blocks, no explanation, no extra text.'
    ].join('\n');

    let message: Anthropic.Message;
    try {
      message = await this.getClient().messages.create(
        {
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        },
        { timeout: timeoutMs }
      );
    } catch (e) {
      if (e instanceof Anthropic.APIConnectionTimeoutError) throw new Error(`API call timed out after ${timeoutMs}ms`);
      if (e instanceof Anthropic.RateLimitError) throw new Error('API rate limit exceeded: 429');
      if (e instanceof Anthropic.InternalServerError) throw new Error(`API server error (${e.status}): ${e.message}`);
      if (e instanceof Anthropic.APIConnectionError) throw new Error(`API connection failed: ${e.message}`);
      throw e;
    }

    const block = message.content[0];
    if (!block || block.type !== 'text') {
      throw new Error('Unexpected API response: no text content');
    }

    return block.text;
  }
}
