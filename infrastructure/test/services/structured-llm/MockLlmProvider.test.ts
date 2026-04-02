import { describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { MockLlmProvider } from '../../../src/services/structured-llm/MockLlmProvider.js';

const provider = new MockLlmProvider();

const dummyInput = z.object({ text: z.string() });

function generate<T extends z.ZodType>(outputSchema: T) {
  return provider.generate({
    prompt: 'test prompt',
    inputSchema: dummyInput,
    outputSchema,
    context: { text: 'hello' }
  });
}

describe('MockLlmProvider', () => {
  it('returns empty string for z.string()', async () => {
    expect(await generate(z.object({ name: z.string() }))).toEqual({ name: '' });
  });

  it('returns 0 for z.number()', async () => {
    expect(await generate(z.object({ count: z.number() }))).toEqual({ count: 0 });
  });

  it('returns false for z.boolean()', async () => {
    expect(await generate(z.object({ active: z.boolean() }))).toEqual({ active: false });
  });

  it('returns empty array for z.array()', async () => {
    expect(await generate(z.object({ items: z.array(z.string()) }))).toEqual({ items: [] });
  });

  it('returns null for z.nullable()', async () => {
    expect(await generate(z.object({ value: z.string().nullable() }))).toEqual({ value: null });
  });

  it('returns first value for z.enum()', async () => {
    const schema = z.object({ color: z.enum(['red', 'blue', 'green']) });
    expect(await generate(schema)).toEqual({ color: 'red' });
  });

  it('returns first value for z.nativeEnum()', async () => {
    enum Status {
      ACTIVE = 'ACTIVE',
      INACTIVE = 'INACTIVE'
    }
    const schema = z.object({ status: z.nativeEnum(Status) });
    expect(await generate(schema)).toEqual({ status: 'ACTIVE' });
  });

  it('handles nested objects', async () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number()
      })
    });
    expect(await generate(schema)).toEqual({ user: { name: '', age: 0 } });
  });

  it('handles complex schemas', async () => {
    const schema = z.object({
      title: z.string(),
      count: z.number(),
      tags: z.array(z.string()),
      metadata: z.object({
        created: z.boolean(),
        label: z.string().nullable()
      })
    });

    const result = await generate(schema);
    expect(result).toEqual({
      title: '',
      count: 0,
      tags: [],
      metadata: { created: false, label: null }
    });
  });

  it('validates output against schema', async () => {
    const schema = z.object({ name: z.string() });
    const result = await generate(schema);
    expect(() => schema.parse(result)).not.toThrow();
  });

  it('returns default value for z.default()', async () => {
    const schema = z.object({ name: z.string().default('fallback') });
    expect(await generate(schema)).toEqual({ name: 'fallback' });
  });

  it('returns literal value for z.literal()', async () => {
    const schema = z.object({ type: z.literal('fixed') });
    expect(await generate(schema)).toEqual({ type: 'fixed' });
  });
});
