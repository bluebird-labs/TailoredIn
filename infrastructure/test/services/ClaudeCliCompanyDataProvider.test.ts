import { describe, expect, mock, test } from 'bun:test';
import { BusinessType, CompanyStage, err, Industry, ok } from '@tailoredin/domain';
import { ClaudeCliCompanyDataProvider } from '../../src/services/ClaudeCliCompanyDataProvider.js';
import type { ClaudeCliProvider } from '../../src/services/llm/ClaudeCliProvider.js';
import { LlmRequestError } from '../../src/services/llm/LlmRequestError.js';

function createMockProvider(result: ReturnType<typeof ok> | ReturnType<typeof err>) {
  return { request: mock(() => Promise.resolve(result)) } as unknown as ClaudeCliProvider;
}

describe('ClaudeCliCompanyDataProvider', () => {
  test('returns enrichment result from successful LLM response', async () => {
    const mockProvider = createMockProvider(
      ok({
        name: 'GitHub',
        description: 'Code hosting platform',
        website: null,
        linkedinLink: null,
        businessType: BusinessType.PLATFORM,
        industry: Industry.SAAS,
        stage: CompanyStage.ACQUIRED
      })
    );

    const dataProvider = new ClaudeCliCompanyDataProvider(mockProvider);
    const result = await dataProvider.enrichFromUrl('https://github.com');

    expect(result.name).toBe('GitHub');
    expect(result.description).toBe('Code hosting platform');
    expect(result.businessType).toBe(BusinessType.PLATFORM);
    expect(result.industry).toBe(Industry.SAAS);
    expect(result.stage).toBe(CompanyStage.ACQUIRED);
    expect(result.logoUrl).toBeNull();
  });

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
    expect(result.businessType).toBeNull();
    expect(result.logoUrl).toBeNull();
  });
});
