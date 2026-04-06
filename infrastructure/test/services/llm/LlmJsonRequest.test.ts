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
  test('getJsonSchema produces valid JSON with type "object" at root', () => {
    const request = new TestRequest();
    const json = request.getJsonSchema();
    const parsed = JSON.parse(json);

    expect(parsed.type).toBe('object');
    expect(parsed.properties).toBeDefined();
    expect(parsed.properties.name).toBeDefined();
    expect(parsed.properties.items).toBeDefined();
  });

  test('getJsonSchema output is a string', () => {
    const request = new TestRequest();
    expect(typeof request.getJsonSchema()).toBe('string');
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
