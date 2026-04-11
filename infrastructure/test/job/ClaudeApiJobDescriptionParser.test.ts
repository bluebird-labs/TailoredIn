import { describe, expect, mock, test } from 'bun:test';
import { err, JobLevel, LocationType, ok } from '@tailoredin/domain';
import { ClaudeApiJobDescriptionParser } from '../../src/job/ClaudeApiJobDescriptionParser.js';
import type { ClaudeApiProvider } from '../../src/llm/ClaudeApiProvider.js';
import { LlmRequestError } from '../../src/llm/LlmRequestError.js';

function createMockProvider(result: ReturnType<typeof ok> | ReturnType<typeof err>) {
  return { request: mock(() => Promise.resolve(result)) } as unknown as ClaudeApiProvider;
}

function fullLlmResponse(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Senior Software Engineer',
    description: 'Build great things.',
    url: 'https://example.com/jobs/123',
    location: 'San Francisco, CA',
    salaryMin: 150000,
    salaryMax: 200000,
    salaryCurrency: 'USD',
    level: JobLevel.SENIOR,
    locationType: LocationType.HYBRID,
    postedAt: '2026-01-01',
    ...overrides
  };
}

describe('ClaudeApiJobDescriptionParser', () => {
  test('parses a full job description response', async () => {
    const mockProvider = createMockProvider(ok(fullLlmResponse()));

    const parser = new ClaudeApiJobDescriptionParser(mockProvider);
    const result = await parser.parseFromText('some job description text');

    expect(result.title).toBe('Senior Software Engineer');
    expect(result.level).toBe(JobLevel.SENIOR);
    expect(result.locationType).toBe(LocationType.HYBRID);
    expect(result.salaryMin).toBe(150000);
    expect(result.salaryMax).toBe(200000);
    expect(result.salaryCurrency).toBe('USD');
  });

  test('handles all-null response gracefully', async () => {
    const mockProvider = createMockProvider(
      ok({
        title: null,
        description: null,
        url: null,
        location: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        level: null,
        locationType: null,
        postedAt: null
      })
    );

    const parser = new ClaudeApiJobDescriptionParser(mockProvider);
    const result = await parser.parseFromText('unparseable text');

    expect(result.title).toBeNull();
    expect(result.level).toBeNull();
    expect(result.locationType).toBeNull();
  });

  test('throws ExternalServiceError on LLM failure', async () => {
    const mockProvider = createMockProvider(err(new LlmRequestError('API error', [], null, '', '', 100)));

    const parser = new ClaudeApiJobDescriptionParser(mockProvider);

    await expect(parser.parseFromText('some text')).rejects.toThrow('Job description parsing failed');
  });
});
