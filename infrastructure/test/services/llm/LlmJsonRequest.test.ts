import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { LlmJsonRequest } from '../../../src/services/llm/LlmJsonRequest.js';

class TestRequest extends LlmJsonRequest<typeof TestRequest.testSchema> {
  private static readonly testSchema = z.object({
    name: z.string(),
    items: z.array(z.string()).max(3)
  });

  public readonly schema = TestRequest.testSchema;

  public get prompt(): string {
    return 'test prompt';
  }
}

describe('LlmJsonRequest', () => {
  test('getJsonSchema produces an object with type "object" at root', () => {
    const request = new TestRequest();
    const schema = request.getJsonSchema();

    expect(schema.type).toBe('object');
    expect(schema.properties).toBeDefined();
    expect((schema.properties as Record<string, unknown>).name).toBeDefined();
    expect((schema.properties as Record<string, unknown>).items).toBeDefined();
  });

  test('getJsonSchema output is an object', () => {
    const request = new TestRequest();
    expect(typeof request.getJsonSchema()).toBe('object');
  });

  test('prompt returns the abstract implementation', () => {
    const request = new TestRequest();
    expect(request.prompt).toBe('test prompt');
  });

  test('maxTokens defaults to undefined', () => {
    const testSchema = z.object({ x: z.string() });

    class ConcreteRequest extends LlmJsonRequest<typeof testSchema> {
      public readonly schema = testSchema;

      public get prompt(): string {
        return 'test';
      }
    }

    expect(new ConcreteRequest().maxTokens).toBeUndefined();
  });
});
