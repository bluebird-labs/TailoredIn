import { describe, expect, test } from 'bun:test';
import { Logger } from '@tailoredin/core';
import { z } from 'zod';
import { BaseLlmCliProvider } from '../../../src/services/llm/BaseLlmCliProvider.js';
import { LlmJsonRequest } from '../../../src/services/llm/LlmJsonRequest.js';
import { LlmRequestError } from '../../../src/services/llm/LlmRequestError.js';
import type { LlmRequestOptions } from '../../../src/services/llm/LlmRequestOptions.js';

const testSchema = z.object({ name: z.string(), count: z.number() });

class TestRequest extends LlmJsonRequest<typeof testSchema> {
  public readonly schema = testSchema;
  public get prompt(): string {
    return 'test prompt';
  }
}

const testResponseSchema = z
  .object({
    data: z.unknown().optional()
  })
  .passthrough();

class TestProvider extends BaseLlmCliProvider<typeof testResponseSchema> {
  protected readonly log = Logger.create('test-provider');
  protected readonly responseSchema = testResponseSchema;
  public extractedValue: unknown = null;
  public spawnBehavior: 'success' | 'fail-exit' | 'fail-spawn' = 'success';
  public stdout = '';
  public stderr = '';

  protected buildCommand(): string[] {
    return ['echo', 'test'];
  }

  protected extractResult(response: z.infer<typeof testResponseSchema>): unknown {
    return response.data ?? this.extractedValue;
  }

  // Override request to avoid actual Bun.spawn
  public override async request<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    _options?: LlmRequestOptions
  ) {
    const jsonSchema = request.getJsonSchema();
    const command = this.buildCommand(request, jsonSchema);

    if (this.spawnBehavior === 'fail-spawn') {
      return {
        isOk: false as const,
        isErr: true as const,
        error: new LlmRequestError('Failed to spawn CLI: spawn error', command, null, '', '', 0)
      };
    }

    if (this.spawnBehavior === 'fail-exit') {
      return {
        isOk: false as const,
        isErr: true as const,
        error: new LlmRequestError('CLI exited with code 1', command, 1, this.stdout, this.stderr, 100)
      };
    }

    const extracted = this.extractedValue;

    if (extracted == null) {
      return {
        isOk: false as const,
        isErr: true as const,
        error: new LlmRequestError('Empty result from LLM', command, 0, this.stdout, this.stderr, 100)
      };
    }

    const parsed = request.schema.safeParse(extracted);

    if (!parsed.success) {
      const message = `Zod validation failed: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
      return {
        isOk: false as const,
        isErr: true as const,
        error: new LlmRequestError(message, command, 0, this.stdout, this.stderr, 100)
      };
    }

    return { isOk: true as const, isErr: false as const, value: parsed.data as z.infer<T> };
  }
}

describe('BaseLlmCliProvider', () => {
  test('returns ok result on successful parse', async () => {
    const provider = new TestProvider();
    provider.extractedValue = { name: 'Acme', count: 42 };
    provider.spawnBehavior = 'success';

    const result = await provider.request(new TestRequest());

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.name).toBe('Acme');
      expect(result.value.count).toBe(42);
    }
  });

  test('returns err on spawn failure', async () => {
    const provider = new TestProvider();
    provider.spawnBehavior = 'fail-spawn';

    const result = await provider.request(new TestRequest());

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBeInstanceOf(LlmRequestError);
      expect(result.error.message).toContain('spawn');
      expect(result.error.exitCode).toBeNull();
    }
  });

  test('returns err on non-zero exit code', async () => {
    const provider = new TestProvider();
    provider.spawnBehavior = 'fail-exit';
    provider.stdout = 'error output';
    provider.stderr = 'stderr output';

    const result = await provider.request(new TestRequest());

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBeInstanceOf(LlmRequestError);
      expect(result.error.exitCode).toBe(1);
      expect(result.error.stdout).toBe('error output');
      expect(result.error.stderr).toBe('stderr output');
    }
  });

  test('returns err on empty result', async () => {
    const provider = new TestProvider();
    provider.extractedValue = null;
    provider.spawnBehavior = 'success';

    const result = await provider.request(new TestRequest());

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Empty result');
    }
  });

  test('returns err on Zod validation failure', async () => {
    const provider = new TestProvider();
    provider.extractedValue = { name: 123, count: 'not a number' };
    provider.spawnBehavior = 'success';

    const result = await provider.request(new TestRequest());

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Zod validation failed');
    }
  });

  test('LlmRequestError contains full context', async () => {
    const provider = new TestProvider();
    provider.spawnBehavior = 'fail-exit';
    provider.stdout = 'full stdout';
    provider.stderr = 'full stderr';

    const result = await provider.request(new TestRequest());

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.command).toEqual(['echo', 'test']);
      expect(result.error.duration).toBeGreaterThanOrEqual(0);
    }
  });
});

const rawResponseSchema = z.object({}).passthrough();

class SpawningTestProvider extends BaseLlmCliProvider<typeof rawResponseSchema> {
  protected readonly log = Logger.create('spawning-test-provider');
  protected readonly responseSchema = rawResponseSchema;

  public commandArgs: string[] = ['sleep', '120'];

  protected buildCommand(): string[] {
    return this.commandArgs;
  }

  protected extractResult(response: z.infer<typeof rawResponseSchema>): unknown {
    return response;
  }
}

describe('BaseLlmCliProvider timeout', () => {
  test('returns error when CLI process exceeds timeout', async () => {
    const provider = new SpawningTestProvider();

    const result = await provider.request(new TestRequest(), { timeoutMs: 1000, maxRetries: 1 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBeInstanceOf(LlmRequestError);
      expect(result.error.message).toContain('timed out');
    }
  }, 10_000);
});

const VALID_JSON = JSON.stringify({ name: 'OK', count: 1 });

class CountingProvider extends BaseLlmCliProvider<typeof rawResponseSchema> {
  protected readonly log = Logger.create('counting-provider');
  protected readonly responseSchema = rawResponseSchema;
  public callCount = 0;
  public failUntil = 2;

  protected buildCommand(): string[] {
    this.callCount++;
    if (this.callCount <= this.failUntil) {
      return ['sh', '-c', 'exit 1'];
    }
    return ['sh', '-c', `echo '${VALID_JSON}'`];
  }

  protected extractResult(response: z.infer<typeof rawResponseSchema>): unknown {
    return response;
  }

  protected override sleep(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

class SingleCallProvider extends BaseLlmCliProvider<typeof rawResponseSchema> {
  protected readonly log = Logger.create('single-call-provider');
  protected readonly responseSchema = rawResponseSchema;
  public callCount = 0;

  protected buildCommand(): string[] {
    this.callCount++;
    return ['sh', '-c', `echo '{"wrong":"shape"}'`];
  }

  protected extractResult(response: z.infer<typeof rawResponseSchema>): unknown {
    return response;
  }

  protected override sleep(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

class AlwaysFailProvider extends BaseLlmCliProvider<typeof rawResponseSchema> {
  protected readonly log = Logger.create('always-fail-provider');
  protected readonly responseSchema = rawResponseSchema;
  public callCount = 0;

  protected buildCommand(): string[] {
    this.callCount++;
    return ['sh', '-c', 'exit 1'];
  }

  protected extractResult(_response: z.infer<typeof rawResponseSchema>): unknown {
    return null;
  }

  protected override sleep(_ms: number): Promise<void> {
    return Promise.resolve();
  }
}

describe('BaseLlmCliProvider retry', () => {
  test('retries on failure then succeeds', async () => {
    const provider = new CountingProvider();
    provider.failUntil = 2;

    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(provider.callCount).toBe(3);
    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.name).toBe('OK');
      expect(result.value.count).toBe(1);
    }
  }, 10_000);

  test('does not retry Zod validation failure', async () => {
    const provider = new SingleCallProvider();

    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(provider.callCount).toBe(1);
    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('Zod validation failed');
    }
  });

  test('returns last error after exhausting retries', async () => {
    const provider = new AlwaysFailProvider();

    const result = await provider.request(new TestRequest(), { maxRetries: 3, retryDelayMs: 10 });

    expect(provider.callCount).toBe(3);
    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBeInstanceOf(LlmRequestError);
      expect(result.error.message).toContain('CLI exited with code');
    }
  }, 10_000);
});
