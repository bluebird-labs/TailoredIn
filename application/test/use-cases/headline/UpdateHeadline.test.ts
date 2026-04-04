import { describe, expect, test } from 'bun:test';
import { Headline, HeadlineId, type HeadlineRepository } from '@tailoredin/domain';
import { UpdateHeadline } from '../../../src/use-cases/headline/UpdateHeadline.js';

const NOW = new Date('2025-01-01');

function makeHeadline(label: string): Headline {
  return new Headline({
    id: HeadlineId.generate(),
    profileId: 'profile-1',
    label,
    summaryText: 'Original summary',
    createdAt: NOW,
    updatedAt: NOW
  });
}

function mockHeadlineRepo(headline?: Headline, onSave?: (h: Headline) => void): HeadlineRepository {
  return {
    findByIdOrFail: async (id: string) => {
      if (!headline || headline.id.value !== id) throw new Error(`Headline not found: ${id}`);
      return headline;
    },
    findAll: async () => (headline ? [headline] : []),
    save: async (h: Headline) => {
      onSave?.(h);
    },
    delete: async () => {}
  };
}

describe('UpdateHeadline', () => {
  test('updates label and summaryText', async () => {
    const headline = makeHeadline('Old Label');
    let saved: Headline | undefined;

    const useCase = new UpdateHeadline(
      mockHeadlineRepo(headline, h => {
        saved = h;
      })
    );

    const result = await useCase.execute({
      headlineId: headline.id.value,
      label: 'New Label',
      summaryText: 'Updated summary'
    });

    expect(result.isOk).toBe(true);
    if (!result.isOk) return;

    expect(result.value.id).toBe(headline.id.value);
    expect(result.value.label).toBe('New Label');
    expect(result.value.summaryText).toBe('Updated summary');
    expect(saved).toBeDefined();
  });

  test('returns err when headline not found', async () => {
    const useCase = new UpdateHeadline(mockHeadlineRepo(undefined));

    const result = await useCase.execute({
      headlineId: 'nonexistent-id',
      label: 'New Label',
      summaryText: 'Updated summary'
    });

    expect(result.isOk).toBe(false);
    if (result.isOk) return;
    expect(result.error.message).toContain('nonexistent-id');
  });
});
