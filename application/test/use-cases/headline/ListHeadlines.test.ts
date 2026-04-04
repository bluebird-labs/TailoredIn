import { describe, expect, test } from 'bun:test';
import { Headline, HeadlineId, type HeadlineRepository } from '@tailoredin/domain';
import { ListHeadlines } from '../../../src/use-cases/headline/ListHeadlines.js';

const NOW = new Date('2025-01-01');

function makeHeadline(label: string): Headline {
  return new Headline({
    id: HeadlineId.generate(),
    profileId: 'profile-1',
    label,
    summaryText: `Summary for ${label}`,
    createdAt: NOW,
    updatedAt: NOW
  });
}

function mockHeadlineRepo(headlines: Headline[]): HeadlineRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => headlines,
    save: async () => {},
    delete: async () => {}
  };
}

describe('ListHeadlines', () => {
  test('returns all headlines as DTOs', async () => {
    const h1 = makeHeadline('Senior Engineer');
    const h2 = makeHeadline('Tech Lead');

    const useCase = new ListHeadlines(mockHeadlineRepo([h1, h2]));
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe(h1.id.value);
    expect(result[0]!.label).toBe('Senior Engineer');
    expect(result[0]!.summaryText).toBe('Summary for Senior Engineer');
    expect(result[1]!.label).toBe('Tech Lead');
  });

  test('returns empty array when no headlines', async () => {
    const useCase = new ListHeadlines(mockHeadlineRepo([]));
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });
});
