import { describe, expect, test } from 'bun:test';
import { ClaudeCliProvider } from '../../../src/services/llm/ClaudeCliProvider.js';
import type { ClaudeCliResponse } from '../../../src/services/llm/ClaudeCliResponse.js';

function makeResponse(overrides: Partial<ClaudeCliResponse> = {}): string {
  const base: ClaudeCliResponse = {
    type: 'result',
    subtype: 'success',
    is_error: false,
    duration_ms: 1000,
    duration_api_ms: 900,
    num_turns: 1,
    result: JSON.stringify({ name: 'Test' }),
    stop_reason: 'end_turn',
    session_id: 'test-session',
    total_cost_usd: 0.01,
    usage: {
      input_tokens: 10,
      output_tokens: 20,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      server_tool_use: { web_search_requests: 0, web_fetch_requests: 0 }
    },
    ...overrides
  };
  return JSON.stringify(base);
}

// Access protected method via subclass for testing
class TestableClaudeCliProvider extends ClaudeCliProvider {
  public testExtractResult(stdout: string): unknown {
    return this.extractResult(stdout);
  }
}

describe('ClaudeCliProvider.extractResult', () => {
  const provider = new TestableClaudeCliProvider();

  test('parses successful response with JSON string result', () => {
    const stdout = makeResponse({ result: '{"companies": []}' });
    const result = provider.testExtractResult(stdout);
    expect(result).toEqual({ companies: [] });
  });

  test('returns null for is_error response', () => {
    const stdout = makeResponse({ is_error: true, result: 'API Error: 400 ...' });
    const result = provider.testExtractResult(stdout);
    expect(result).toBeNull();
  });

  test('returns null for empty string result', () => {
    const stdout = makeResponse({ result: '' });
    const result = provider.testExtractResult(stdout);
    expect(result).toBeNull();
  });

  test('strips code fences from result', () => {
    const stdout = makeResponse({ result: '```json\n{"name": "Acme"}\n```' });
    const result = provider.testExtractResult(stdout);
    expect(result).toEqual({ name: 'Acme' });
  });

  test('throws on invalid JSON stdout', () => {
    expect(() => provider.testExtractResult('not json')).toThrow();
  });
});
