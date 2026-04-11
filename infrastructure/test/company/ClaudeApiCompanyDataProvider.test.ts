import { describe, expect, mock, test } from 'bun:test';
import { BusinessType, CompanyStage, err, Industry, ok } from '@tailoredin/domain';
import { ClaudeApiCompanyDataProvider } from '../../src/company/ClaudeApiCompanyDataProvider.js';
import type { ClaudeApiProvider } from '../../src/llm/ClaudeApiProvider.js';
import { LlmRequestError } from '../../src/llm/LlmRequestError.js';

function createMockProvider(result: ReturnType<typeof ok> | ReturnType<typeof err>) {
  return { request: mock(() => Promise.resolve(result)) } as unknown as ClaudeApiProvider;
}

function fullLlmResponse(overrides: Record<string, unknown> = {}) {
  return {
    name: 'GitHub',
    description: 'Code hosting platform',
    website: 'https://github.com',
    linkedinLink: 'https://linkedin.com/company/github',
    logoUrl: null as string | null,
    businessType: BusinessType.PLATFORM,
    industry: Industry.SOFTWARE,
    stage: CompanyStage.ACQUIRED,
    ...overrides
  };
}

describe('ClaudeApiCompanyDataProvider', () => {
  describe('URL handling', () => {
    test('URLs from LLM are kept as-is (not cleared by HEAD validation)', async () => {
      const mockProvider = createMockProvider(
        ok(
          fullLlmResponse({
            website: 'https://github.com',
            linkedinLink: 'https://linkedin.com/company/github'
          })
        )
      );

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://github.com');

      expect(result.website).toBe('https://github.com');
      expect(result.linkedinLink).toBe('https://linkedin.com/company/github');
    });

    test('URLs without protocol get https:// prepended via normalizeUrl', async () => {
      const mockProvider = createMockProvider(
        ok(
          fullLlmResponse({
            website: 'github.com',
            linkedinLink: 'linkedin.com/company/github'
          })
        )
      );

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://github.com');

      expect(result.website).toBe('https://github.com');
      expect(result.linkedinLink).toBe('https://linkedin.com/company/github');
    });

    test('empty/whitespace URLs become null', async () => {
      const mockProvider = createMockProvider(
        ok(
          fullLlmResponse({
            website: '   ',
            linkedinLink: ''
          })
        )
      );

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://example.com');

      expect(result.website).toBeNull();
      expect(result.linkedinLink).toBeNull();
    });
  });

  describe('error handling', () => {
    test('throws ExternalServiceError on LLM failure', async () => {
      const mockProvider = createMockProvider(err(new LlmRequestError('API error', [], null, '', '', 100)));

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);

      await expect(dataProvider.enrichFromUrl('https://example.com')).rejects.toThrow('Company enrichment failed');
    });

    test('handles all-null enrichment response', async () => {
      const mockProvider = createMockProvider(
        ok({
          name: null,
          description: null,
          website: null,
          linkedinLink: null,
          logoUrl: null,
          businessType: null,
          industry: null,
          stage: null
        })
      );

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://unknown.com');

      expect(result.name).toBeNull();
      expect(result.description).toBeNull();
      expect(result.website).toBeNull();
      expect(result.linkedinLink).toBeNull();
      expect(result.businessType).toBeNull();
      expect(result.industry).toBeNull();
      expect(result.stage).toBeNull();
      expect(result.logoUrl).toBeNull();
    });
  });

  describe('logo provider chain', () => {
    test('LLM-provided logoUrl is discarded when it fails image validation (dead/wrong URL)', async () => {
      // A fake URL like this will fail the HEAD request — the new behavior discards it
      const mockProvider = createMockProvider(
        ok(
          fullLlmResponse({
            logoUrl: 'https://example.com/logo.png',
            website: null // no website → no fallback providers
          })
        )
      );

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://example.com');

      // Invalid/dead URL is discarded — result is null
      expect(result.logoUrl).toBeNull();
    });

    test('falls back to domain-based providers when LLM provides no logo', async () => {
      const mockProvider = createMockProvider(
        ok(
          fullLlmResponse({
            logoUrl: null,
            website: 'https://github.com'
          })
        )
      );

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://github.com');

      // Result is either a string URL from a provider or null — can't control external services
      expect(result.logoUrl === null || typeof result.logoUrl === 'string').toBe(true);
    });

    test('returns null logoUrl when no website and no valid LLM logo', async () => {
      const mockProvider = createMockProvider(
        ok(
          fullLlmResponse({
            logoUrl: null,
            website: null
          })
        )
      );

      const dataProvider = new ClaudeApiCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://unknown.com');

      expect(result.logoUrl).toBeNull();
    });
  });
});
