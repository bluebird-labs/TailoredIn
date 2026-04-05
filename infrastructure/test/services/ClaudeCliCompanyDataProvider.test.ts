import { describe, expect, mock, test } from 'bun:test';
import { BusinessType, CompanyStage, err, Industry, ok } from '@tailoredin/domain';
import { ClaudeCliCompanyDataProvider } from '../../src/services/ClaudeCliCompanyDataProvider.js';
import type { ClaudeCliProvider } from '../../src/services/llm/ClaudeCliProvider.js';
import { LlmRequestError } from '../../src/services/llm/LlmRequestError.js';

function createMockProvider(result: ReturnType<typeof ok> | ReturnType<typeof err>) {
  return { request: mock(() => Promise.resolve(result)) } as unknown as ClaudeCliProvider;
}

function fullLlmResponse(overrides: Record<string, unknown> = {}) {
  return {
    name: 'GitHub',
    description: 'Code hosting platform',
    website: 'https://github.com',
    linkedinLink: 'https://linkedin.com/company/github',
    businessType: BusinessType.PLATFORM,
    industry: Industry.SAAS,
    stage: CompanyStage.ACQUIRED,
    ...overrides
  };
}

describe('ClaudeCliCompanyDataProvider', () => {
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

      const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
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

      const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
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

      const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
      const result = await dataProvider.enrichFromUrl('https://example.com');

      expect(result.website).toBeNull();
      expect(result.linkedinLink).toBeNull();
    });
  });

  describe('error handling', () => {
    test('throws ExternalServiceError on LLM failure', async () => {
      const mockProvider = createMockProvider(
        err(new LlmRequestError('CLI exited with code 1', ['claude'], 1, '', '', 100))
      );

      const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);

      await expect(dataProvider.enrichFromUrl('https://example.com')).rejects.toThrow('Company enrichment failed');
    });

    test('handles all-null enrichment response', async () => {
      const mockProvider = createMockProvider(
        ok({
          name: null,
          description: null,
          website: null,
          linkedinLink: null,
          businessType: null,
          industry: null,
          stage: null
        })
      );

      const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
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
});
