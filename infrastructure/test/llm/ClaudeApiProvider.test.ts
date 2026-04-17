import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ClaudeApiProvider } from '../../src/llm/ClaudeApiProvider.js';
import { LlmJsonRequest } from '../../src/llm/LlmJsonRequest.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const schema = z.object({ title: z.string(), score: z.number() });

class JobRequest extends LlmJsonRequest<typeof schema> {
  public readonly schema = schema;
  public get prompt(): string {
    return 'Analyze this job description: Software Engineer';
  }
}

class JobRequestWithModel extends LlmJsonRequest<typeof schema> {
  public readonly schema = schema;
  public get model(): string {
    return 'claude-haiku-4-5-20251001';
  }
  public get prompt(): string {
    return 'Analyze with custom model';
  }
}

class JobRequestWithMaxTokens extends LlmJsonRequest<typeof schema> {
  public readonly schema = schema;
  public get prompt(): string {
    return 'Short analysis';
  }
  public override get maxTokens(): number {
    return 256;
  }
}

// ── Test subclass that injects a mock Anthropic client ──────────────────────

type MessagesParse = (params: unknown, options?: unknown) => Promise<unknown>;

class TestableClaudeApiProvider extends ClaudeApiProvider {
  public constructor(
    apiKey: string,
    private readonly mockMessagesParse: MessagesParse
  ) {
    super(apiKey);
  }

  protected override getClient(): Anthropic {
    return { messages: { parse: this.mockMessagesParse } } as unknown as Anthropic;
  }
}

function makeProvider(mockParse: MessagesParse): TestableClaudeApiProvider {
  return new TestableClaudeApiProvider('test-key', mockParse);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClaudeApiProvider', () => {
  test('calls Anthropic messages.parse with correct model and returns parsed result', async () => {
    let capturedParams: unknown;

    const provider = makeProvider(async params => {
      capturedParams = params;
      return { parsed_output: { title: 'Senior Engineer', score: 9 } };
    });

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.title).toBe('Senior Engineer');
      expect(result.value.score).toBe(9);
    }

    const p = capturedParams as { model: string; messages: Array<{ role: string; content: string }> };
    expect(p.model).toBe('claude-sonnet-4-6');
    expect(p.messages[0].role).toBe('user');
    expect(p.messages[0].content).toBe('Analyze this job description: Software Engineer');
  });

  test('uses model override from request when provided', async () => {
    let capturedModel: string | undefined;

    const provider = makeProvider(async params => {
      capturedModel = (params as { model: string }).model;
      return { parsed_output: { title: 'Junior', score: 5 } };
    });

    await provider.request(new JobRequestWithModel(), { maxRetries: 1 });

    expect(capturedModel).toBe('claude-haiku-4-5-20251001');
  });

  test('passes maxTokens from request to the API call', async () => {
    let capturedMaxTokens: number | undefined;

    const provider = makeProvider(async params => {
      capturedMaxTokens = (params as { max_tokens: number }).max_tokens;
      return { parsed_output: { title: 'X', score: 1 } };
    });

    await provider.request(new JobRequestWithMaxTokens(), { maxRetries: 1 });

    expect(capturedMaxTokens).toBe(256);
  });

  test('passes output_config with JSON schema format to messages.parse', async () => {
    let capturedParams: unknown;

    const provider = makeProvider(async params => {
      capturedParams = params;
      return { parsed_output: { title: 'X', score: 1 } };
    });

    await provider.request(new JobRequest(), { maxRetries: 1 });

    const p = capturedParams as { output_config?: { format?: unknown } };
    expect(p.output_config).toBeDefined();
    expect(p.output_config?.format).toBeDefined();
  });

  test('returns err when messages.parse returns no parsed_output', async () => {
    const provider = makeProvider(async () => ({ parsed_output: undefined }));

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    expect(result.error!.message).toContain('Schema validation failed');
  });

  test('returns err when API throws', async () => {
    const provider = makeProvider(async () => {
      throw new Error('API call timed out after 60000ms');
    });

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('timed out');
    }
  });

  test('translates APIConnectionTimeoutError to retryable timed out message', async () => {
    const provider = makeProvider(async () => {
      throw new Anthropic.APIConnectionTimeoutError();
    });

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('API call timed out');
    }
  });

  test('translates RateLimitError to retryable rate limit message', async () => {
    const provider = makeProvider(async () => {
      throw new Anthropic.RateLimitError(
        429,
        { message: 'Rate limited' },
        'Rate limited',
        undefined as unknown as Headers
      );
    });

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('API rate limit exceeded');
    }
  });

  test('translates InternalServerError to retryable server error message', async () => {
    const provider = makeProvider(async () => {
      throw new Anthropic.InternalServerError(
        500,
        { message: 'Internal error' },
        'Internal error',
        undefined as unknown as Headers
      );
    });

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('API server error');
    }
  });

  test('translates APIConnectionError to connection failed message', async () => {
    const provider = makeProvider(async () => {
      throw new Anthropic.APIConnectionError({ message: 'ECONNREFUSED' });
    });

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('API connection failed');
    }
  });
});
