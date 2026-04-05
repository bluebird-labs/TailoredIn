import { describe, expect, mock, test } from 'bun:test';
import { err, ok } from '@tailoredin/domain';
import { ClaudeCliCompanyDiscoveryProvider } from '../../src/services/ClaudeCliCompanyDiscoveryProvider.js';
import type { ClaudeCliProvider } from '../../src/services/llm/ClaudeCliProvider.js';
import { LlmRequestError } from '../../src/services/llm/LlmRequestError.js';

function createMockProvider(result: ReturnType<typeof ok> | ReturnType<typeof err>) {
  return { request: mock(() => Promise.resolve(result)) } as unknown as ClaudeCliProvider;
}

describe('ClaudeCliCompanyDiscoveryProvider', () => {
  test('returns companies from successful LLM response', async () => {
    const mockProvider = createMockProvider(
      ok({
        companies: [
          { name: 'Stripe', website: 'https://stripe.com', description: 'Online payments' },
          { name: 'Stripe Atlas', website: 'https://stripe.com/atlas', description: 'Business incorporation' }
        ]
      })
    );

    const discoveryProvider = new ClaudeCliCompanyDiscoveryProvider(mockProvider);
    const results = await discoveryProvider.discover('stripe');

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Stripe');
    expect(results[0].website).toBe('https://stripe.com');
    expect(results[1].name).toBe('Stripe Atlas');
  });

  test('supports URL-based queries', async () => {
    const mockProvider = createMockProvider(
      ok({
        companies: [{ name: 'Stripe', website: 'https://stripe.com', description: 'Online payments' }]
      })
    );

    const discoveryProvider = new ClaudeCliCompanyDiscoveryProvider(mockProvider);
    const results = await discoveryProvider.discover('https://stripe.com');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Stripe');
  });

  test('throws ExternalServiceError on LLM failure', async () => {
    const mockProvider = createMockProvider(
      err(new LlmRequestError('CLI exited with code 1', ['claude'], 1, '', '', 100))
    );

    const discoveryProvider = new ClaudeCliCompanyDiscoveryProvider(mockProvider);

    await expect(discoveryProvider.discover('test')).rejects.toThrow('Company discovery failed');
  });

  test('returns empty array when LLM returns empty companies', async () => {
    const mockProvider = createMockProvider(ok({ companies: [] }));

    const discoveryProvider = new ClaudeCliCompanyDiscoveryProvider(mockProvider);
    const results = await discoveryProvider.discover('nonexistent');

    expect(results).toEqual([]);
  });
});
