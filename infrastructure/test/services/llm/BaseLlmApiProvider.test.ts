import { describe, expect, test } from 'bun:test';
import { Logger } from '@tailoredin/core';
import { z } from 'zod';
import { BaseLlmApiProvider } from '../../../src/services/llm/BaseLlmApiProvider.js';
import { LlmJsonRequest } from '../../../src/services/llm/LlmJsonRequest.js';
import { LlmRequestError } from '../../../src/services/llm/LlmRequestError.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const testSchema = z.object({ name: z.string(), count: z.number() });

class TestRequest extends LlmJsonRequest<typeof testSchema> {
  public readonly schema = testSchema;
  public get prompt(): string { return 'test prompt'; }
}

class TestRequestWithMaxTokens extends LlmJsonRequest<typeof testSchema> {
  public readonly schema = testSchema;
  public get prompt(): string { return 'test prompt'; }
  public override get maxTokens(): number { return 512; }
}

class TestRequestWithModel extends LlmJsonRequest<typeof testSchema> {
  public readonly schema = testSchema;
  public get prompt(): string { return 'test prompt'; }
  public override get model(): string { return 'custom-model'; }
}

type CallBehavior = 'success' | 'fail-timeout' | 'fail-connection' | 'fail-server-error' | 'fail-rate-limit';

class TestApiProvider extends BaseLlmApiProvider {
  protected readonly log = Logger.create('test-api-provider');
  protected readonly defaultModel = 'test-model';
  protected readonly providerName = 'test-api';
  public callBehavior: CallBehavior = 'success';
  public responseText = '{"name":"Acme","count":42}';
  public callCount = 0;
  public lastMaxTokens: number | undefined;
  public lastModel: string | undefined;
  public lastTimeoutMs: number | undefined;

  protected async callApi(
    _prompt: string,
    _jsonSchema: string,
    model: string,
    maxTokens: number,
    timeoutMs: number
  ): Promise<string> {
    this.callCount++;
    this.lastMaxTokens = maxTokens;
    this.lastModel = model;
    this.lastTimeoutMs = timeoutMs;
    switch (this.callBehavior) {
      case 'fail-timeout':      throw new Error('API call timed out after 1000ms');
      case 'fail-connection':   throw new Error('API connection failed: ECONNREFUSED');
      case 'fail-server-error': throw new Error('API server error (500): Internal Server Error');
      case 'fail-rate-limit':   throw new Error('API rate limit exceeded: 429');
      default:                  return this.responseText;
    }
  }

  public override sleep(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

class CountingTestApiProvider extends BaseLlmApiProvider {
  protected readonly log = Logger.create('counting-test-api-provider');
  protected readonly defaultModel = 'test-model';
  protected readonly providerName = 'test-api';
  public callCount = 0;

  constructor(private readonly failUntil: number) { super(); }

  protected async callApi(): Promise<string> {
    this.callCount++;
    if (this.callCount <= this.failUntil) throw new Error('API call timed out after 1000ms');
    return '{"name":"Acme","count":42}';
  }

  public override sleep(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('BaseLlmApiProvider', () => {
  test('returns ok result on successful API call', async () => {
    const provider = new TestApiProvider();

    const result = await provider.request(new TestRequest());

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.name).toBe('Acme');
      expect(result.value.count).toBe(42);
    }
  });

  test('passes default maxTokens (4096) when request does not override', async () => {
    const provider = new TestApiProvider();
    await provider.request(new TestRequest());
    expect(provider.lastMaxTokens).toBe(4096);
  });

  test('passes maxTokens from request when overridden', async () => {
    const provider = new TestApiProvider();
    await provider.request(new TestRequestWithMaxTokens());
    expect(provider.lastMaxTokens).toBe(512);
  });

  test('passes request.model to callApi when overridden', async () => {
    const provider = new TestApiProvider();
    await provider.request(new TestRequestWithModel());
    expect(provider.lastModel).toBe('custom-model');
  });

  test('passes defaultModel to callApi when request has no model override', async () => {
    const provider = new TestApiProvider();
    await provider.request(new TestRequest());
    expect(provider.lastModel).toBe('test-model');
  });

  test('passes timeoutMs from options to callApi', async () => {
    const provider = new TestApiProvider();
    await provider.request(new TestRequest(), { timeoutMs: 5000 });
    expect(provider.lastTimeoutMs).toBe(5000);
  });

  test('passes default timeoutMs (60000) when not specified', async () => {
    const provider = new TestApiProvider();
    await provider.request(new TestRequest());
    expect(provider.lastTimeoutMs).toBe(60_000);
  });

  test('returns err when API call throws', async () => {
    const provider = new TestApiProvider();
    provider.callBehavior = 'fail-connection';

    const result = await provider.request(new TestRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBeInstanceOf(LlmRequestError);
      expect(result.error.message).toContain('API connection failed');
    }
  });

  test('returns err when response is not valid JSON', async () => {
    const provider = new TestApiProvider();
    provider.responseText = 'not json at all';

    const result = await provider.request(new TestRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Failed to parse API response as JSON');
    }
  });

  test('returns err on Zod validation failure', async () => {
    const provider = new TestApiProvider();
    provider.responseText = '{"name":123,"count":"not-a-number"}';

    const result = await provider.request(new TestRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Zod validation failed');
    }
  });

  test('LlmRequestError contains command descriptor and duration', async () => {
    const provider = new TestApiProvider();
    provider.callBehavior = 'fail-connection';

    const result = await provider.request(new TestRequest(), { maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.command).toEqual(['test-api', 'test-model', 'messages']);
      expect(result.error.duration).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('BaseLlmApiProvider retry', () => {
  test('retries on timeout and succeeds on 3rd attempt', async () => {
    const provider = new CountingTestApiProvider(2);

    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(provider.callCount).toBe(3);
    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.name).toBe('Acme');
    }
  });

  test('does not retry Zod validation failure', async () => {
    const provider = new TestApiProvider();
    provider.responseText = '{"wrong":"shape"}';

    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(provider.callCount).toBe(1);
    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Zod validation failed');
    }
  });

  test('does not retry JSON parse failure', async () => {
    const provider = new TestApiProvider();
    provider.responseText = 'invalid json';

    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(provider.callCount).toBe(1);
    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Failed to parse API response as JSON');
    }
  });

  test('exhausts retries and returns last error', async () => {
    const provider = new TestApiProvider();
    provider.callBehavior = 'fail-server-error';

    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(provider.callCount).toBe(3);
    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('API server error');
    }
  });

  test('retries on rate limit error', async () => {
    const provider = new TestApiProvider();
    provider.callBehavior = 'fail-rate-limit';

    const result = await provider.request(new TestRequest(), { maxRetries: 2, retryDelayMs: 10 });

    expect(provider.callCount).toBe(2);
    expect(result.isErr).toBe(true);
  });
});
