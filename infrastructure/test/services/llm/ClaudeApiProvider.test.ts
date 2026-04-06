import { describe, expect, test } from 'bun:test';
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ClaudeApiProvider } from '../../../src/services/llm/ClaudeApiProvider.js';
import { LlmJsonRequest } from '../../../src/services/llm/LlmJsonRequest.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const schema = z.object({ title: z.string(), score: z.number() });

class JobRequest extends LlmJsonRequest<typeof schema> {
  public readonly schema = schema;
  public get prompt(): string { return 'Analyze this job description: Software Engineer'; }
}

class JobRequestWithModel extends LlmJsonRequest<typeof schema> {
  public readonly schema = schema;
  public get model(): string { return 'claude-haiku-4-5-20251001'; }
  public get prompt(): string { return 'Analyze with custom model'; }
}

class JobRequestWithMaxTokens extends LlmJsonRequest<typeof schema> {
  public readonly schema = schema;
  public get prompt(): string { return 'Short analysis'; }
  public override get maxTokens(): number { return 256; }
}

// ── Test subclass that injects a mock Anthropic client ──────────────────────

type MessagesCreate = (params: unknown, options?: unknown) => Promise<unknown>;

class TestableClaudeApiProvider extends ClaudeApiProvider {
  constructor(apiKey: string, private readonly mockMessagesCreate: MessagesCreate) {
    super(apiKey);
  }

  protected override getClient(): Anthropic {
    return { messages: { create: this.mockMessagesCreate } } as unknown as Anthropic;
  }
}

function makeProvider(mockCreate: MessagesCreate): TestableClaudeApiProvider {
  return new TestableClaudeApiProvider('test-key', mockCreate);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClaudeApiProvider', () => {
  test('calls Anthropic messages.create with correct model and returns parsed result', async () => {
    let capturedParams: unknown;

    const provider = makeProvider(async (params) => {
      capturedParams = params;
      return { content: [{ type: 'text', text: '{"title":"Senior Engineer","score":9}' }], stop_reason: 'end_turn' };
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

    const provider = makeProvider(async (params) => {
      capturedModel = (params as { model: string }).model;
      return { content: [{ type: 'text', text: '{"title":"Junior","score":5}' }], stop_reason: 'end_turn' };
    });

    await provider.request(new JobRequestWithModel(), { maxRetries: 1 });

    expect(capturedModel).toBe('claude-haiku-4-5-20251001');
  });

  test('passes maxTokens from request to the API call', async () => {
    let capturedMaxTokens: number | undefined;

    const provider = makeProvider(async (params) => {
      capturedMaxTokens = (params as { max_tokens: number }).max_tokens;
      return { content: [{ type: 'text', text: '{"title":"X","score":1}' }], stop_reason: 'end_turn' };
    });

    await provider.request(new JobRequestWithMaxTokens(), { maxRetries: 1 });

    expect(capturedMaxTokens).toBe(256);
  });

  test('includes JSON schema in system prompt', async () => {
    let capturedSystem: string | undefined;

    const provider = makeProvider(async (params) => {
      capturedSystem = (params as { system: string }).system;
      return { content: [{ type: 'text', text: '{"title":"X","score":1}' }], stop_reason: 'end_turn' };
    });

    await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(capturedSystem).toContain('JSON schema');
    expect(capturedSystem).toContain('"title"');
    expect(capturedSystem).toContain('"score"');
  });

  test('returns err when content block is not text', async () => {
    const provider = makeProvider(async () => ({
      content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
      stop_reason: 'tool_use',
    }));

    const result = await provider.request(new JobRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('no text content');
    }
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
});
