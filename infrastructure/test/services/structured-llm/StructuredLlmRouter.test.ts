import { describe, expect, it } from 'bun:test';
import { LlmProviderKey } from '@tailoredin/application';
import { z } from 'zod';
import { StructuredLlmRouter } from '../../../src/services/structured-llm/StructuredLlmRouter.js';

const router = new StructuredLlmRouter();

const inputSchema = z.object({ text: z.string() });
const outputSchema = z.object({ result: z.string() });

describe('StructuredLlmRouter', () => {
  it('routes to MOCK provider and returns schema defaults', async () => {
    const result = await router.generate({
      prompt: 'test',
      inputSchema,
      outputSchema,
      context: { text: 'hello' },
      provider: LlmProviderKey.MOCK
    });

    expect(result).toEqual({ result: '' });
  });

  it('throws on unknown provider', async () => {
    await expect(
      router.generate({
        prompt: 'test',
        inputSchema,
        outputSchema,
        context: { text: 'hello' },
        provider: 'UNKNOWN' as LlmProviderKey
      })
    ).rejects.toThrow('Unknown LLM provider: UNKNOWN');
  });
});
