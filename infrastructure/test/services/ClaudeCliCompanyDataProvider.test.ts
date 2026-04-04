import { describe, expect, test } from 'bun:test';
import { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import { ClaudeCliCompanyDataProvider } from '../../src/services/ClaudeCliCompanyDataProvider.js';

describe('ClaudeCliCompanyDataProvider', () => {
  test('parses valid JSON response from CLI', () => {
    const validResponse = JSON.stringify({
      name: 'GitHub',
      website: 'https://github.com',
      logoUrl: null,
      linkedinLink: 'https://linkedin.com/company/github',
      businessType: 'platform',
      industry: 'saas',
      stage: 'acquired'
    });

    const provider = new ClaudeCliCompanyDataProvider();
    const result = provider.parseResponse(validResponse);

    expect(result.name).toBe('GitHub');
    expect(result.website).toBe('https://github.com');
    expect(result.logoUrl).toBeNull();
    expect(result.linkedinLink).toBe('https://linkedin.com/company/github');
    expect(result.businessType).toBe(BusinessType.PLATFORM);
    expect(result.industry).toBe(Industry.SAAS);
    expect(result.stage).toBe(CompanyStage.ACQUIRED);
  });

  test('maps unknown enum values to null', () => {
    const response = JSON.stringify({
      name: 'SomeCo',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: 'invalid_type',
      industry: 'not_an_industry',
      stage: 'unknown'
    });

    const provider = new ClaudeCliCompanyDataProvider();
    const result = provider.parseResponse(response);

    expect(result.businessType).toBeNull();
    expect(result.industry).toBeNull();
    expect(result.stage).toBeNull();
  });

  test('handles all-null response', () => {
    const response = JSON.stringify({
      name: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    });

    const provider = new ClaudeCliCompanyDataProvider();
    const result = provider.parseResponse(response);

    expect(result.name).toBeNull();
    expect(result.businessType).toBeNull();
  });

  test('throws on invalid JSON', () => {
    const provider = new ClaudeCliCompanyDataProvider();

    expect(() => provider.parseResponse('not json')).toThrow();
  });
});
