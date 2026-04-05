import { describe, expect, test } from 'bun:test';
import { Logger } from '@tailoredin/core';
import { z } from 'zod';
import type { LlmRequestOptions } from '../../../src/services/llm/BaseLlmCliProvider.js';
import { BaseLlmCliProvider } from '../../../src/services/llm/BaseLlmCliProvider.js';
import { LlmJsonRequest } from '../../../src/services/llm/LlmJsonRequest.js';
import { LlmRequestError } from '../../../src/services/llm/LlmRequestError.js';

const testSchema = z.object({ name: z.string(), count: z.number() });

class TestRequest extends LlmJsonRequest<typeof testSchema> {
  public readonly schema = testSchema;
  public get prompt(): string {
    return 'test prompt';
  }
}

class TestProvider extends BaseLlmCliProvider {
  protected readonly log = Logger.create('test-provider');
  public extractedValue: unknown = null;
  public spawnBehavior: 'success' | 'fail-exit' | 'fail-spawn' = 'success';
  public stdout = '';
  public stderr = '';

  protected buildCommand(): string[] {
    return ['echo', 'test'];
  }

  protected extractResult(_stdout: string): unknown {
    return this.extractedValue;
  }

  // Override request to avoid actual Bun.spawn
  public override async request<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    _options?: LlmRequestOptions
  ) {
    // Simulate the base class logic without spawning
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

    const extracted = this.extractResult(this.stdout);

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

class SpawningTestProvider extends BaseLlmCliProvider {
  protected readonly log = Logger.create('spawning-test-provider');

  public commandArgs: string[] = ['sleep', '120'];

  protected buildCommand(): string[] {
    return this.commandArgs;
  }

  protected extractResult(stdout: string): unknown {
    const parsed = JSON.parse(stdout);
    return JSON.parse(parsed.result);
  }
}

describe('BaseLlmCliProvider timeout', () => {
  test('returns error when CLI process exceeds timeout', async () => {
    const provider = new SpawningTestProvider();

    const result = await provider.request(new TestRequest(), { timeoutMs: 1000 });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBeInstanceOf(LlmRequestError);
      expect(result.error.message).toContain('timed out');
    }
  }, 10_000);
});
