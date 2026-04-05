import { describe, expect, test } from 'bun:test';
import { ClaudeCliCompanySearchProvider } from '../../src/services/ClaudeCliCompanySearchProvider.js';

describe('ClaudeCliCompanySearchProvider', () => {
  test('parses valid JSON array response', () => {
    const validResponse = JSON.stringify([
      { name: 'Stripe', website: 'https://stripe.com', description: 'Online payment processing' },
      { name: 'Stripe Atlas', website: 'https://stripe.com/atlas', description: 'Business incorporation' }
    ]);

    const provider = new ClaudeCliCompanySearchProvider();
    const results = provider.parseResponse(validResponse);

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Stripe');
    expect(results[0].website).toBe('https://stripe.com');
    expect(results[0].description).toBe('Online payment processing');
    expect(results[1].name).toBe('Stripe Atlas');
  });

  test('handles null fields gracefully', () => {
    const response = JSON.stringify([{ name: 'Unknown Corp', website: null, description: null }]);

    const provider = new ClaudeCliCompanySearchProvider();
    const results = provider.parseResponse(response);

    expect(results).toHaveLength(1);
    expect(results[0].website).toBeNull();
    expect(results[0].description).toBeNull();
  });

  test('returns empty array for non-array response', () => {
    const provider = new ClaudeCliCompanySearchProvider();
    const results = provider.parseResponse(JSON.stringify({ name: 'not an array' }));

    expect(results).toEqual([]);
  });

  test('filters out entries without name', () => {
    const response = JSON.stringify([
      { name: 'Valid', website: 'https://valid.com', description: 'A valid company' },
      { website: 'https://no-name.com', description: 'Missing name field' }
    ]);

    const provider = new ClaudeCliCompanySearchProvider();
    const results = provider.parseResponse(response);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Valid');
  });

  test('limits results to 5', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      name: `Company ${i}`,
      website: null,
      description: null
    }));

    const provider = new ClaudeCliCompanySearchProvider();
    const results = provider.parseResponse(JSON.stringify(items));

    expect(results).toHaveLength(5);
  });

  test('throws on invalid JSON', () => {
    const provider = new ClaudeCliCompanySearchProvider();
    expect(() => provider.parseResponse('not json')).toThrow();
  });
});
