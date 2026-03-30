import { describe, expect, test } from 'bun:test';
import { ResumeHeadline, ResumeHeadlineId, type ResumeHeadlineRepository } from '@tailoredin/domain';
import { ListHeadlines } from '../../src/use-cases/ListHeadlines.js';

const NOW = new Date('2025-01-01');

function makeHeadline(label: string): ResumeHeadline {
  return new ResumeHeadline({
    id: ResumeHeadlineId.generate(),
    userId: 'user-1',
    headlineLabel: label,
    summaryText: `Summary for ${label}`,
    createdAt: NOW,
    updatedAt: NOW
  });
}

function mockRepo(headlines: ResumeHeadline[]): ResumeHeadlineRepository {
  return {
    findByIdOrFail: async () => headlines[0]!,
    findAllByUserId: async () => headlines,
    save: async () => {},
    delete: async () => {}
  };
}

describe('ListHeadlines', () => {
  test('returns DTOs for all headlines', async () => {
    const headlines = [makeHeadline('Senior Engineer'), makeHeadline('Tech Lead')];
    const useCase = new ListHeadlines(mockRepo(headlines));

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toHaveLength(2);
    expect(result[0]!.headlineLabel).toBe('Senior Engineer');
    expect(result[1]!.headlineLabel).toBe('Tech Lead');
  });

  test('returns empty array when no headlines', async () => {
    const useCase = new ListHeadlines(mockRepo([]));

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toHaveLength(0);
  });
});
