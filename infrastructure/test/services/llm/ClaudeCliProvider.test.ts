import { describe, expect, test } from 'bun:test';
import { ClaudeCliProvider } from '../../../src/services/llm/ClaudeCliProvider.js';
import type { ClaudeCliResponse } from '../../../src/services/llm/ClaudeCliResponse.js';

function makeResponse(overrides: Partial<ClaudeCliResponse> = {}): ClaudeCliResponse {
  return {
    is_error: false,
    result: JSON.stringify({ name: 'Test' }),
    ...overrides
  };
}

// Access protected method via subclass for testing
class TestableClaudeCliProvider extends ClaudeCliProvider {
  public testExtractResult(response: ClaudeCliResponse): unknown {
    return this.extractResult(response);
  }
}

describe('ClaudeCliProvider.extractResult', () => {
  const provider = new TestableClaudeCliProvider();

  test('prefers structured_output over result', () => {
    const response = makeResponse({
      result: '{"name": "ignored"}',
      structured_output: { companies: [{ name: 'Acme', website: null, description: null }] }
    });
    const result = provider.testExtractResult(response);
    expect(result).toEqual({ companies: [{ name: 'Acme', website: null, description: null }] });
  });

  test('falls back to parsing result when no structured_output', () => {
    const response = makeResponse({ result: '{"companies": []}' });
    const result = provider.testExtractResult(response);
    expect(result).toEqual({ companies: [] });
  });

  test('returns null for is_error response', () => {
    const response = makeResponse({ is_error: true, result: 'API Error: 400 ...' });
    const result = provider.testExtractResult(response);
    expect(result).toBeNull();
  });

  test('returns null for empty string result', () => {
    const response = makeResponse({ result: '' });
    const result = provider.testExtractResult(response);
    expect(result).toBeNull();
  });

  test('throws on invalid JSON in result field', () => {
    const response = makeResponse({ result: 'not json' });
    expect(() => provider.testExtractResult(response)).toThrow();
  });
});
