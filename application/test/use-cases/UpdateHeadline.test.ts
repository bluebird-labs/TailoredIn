import { describe, expect, test } from 'bun:test';
import { ResumeHeadline, ResumeHeadlineId, type ResumeHeadlineRepository } from '@tailoredin/domain';
import { UpdateHeadline } from '../../src/use-cases/UpdateHeadline.js';

const NOW = new Date('2025-01-01');

function makeHeadline(): ResumeHeadline {
  return new ResumeHeadline({
    id: new ResumeHeadlineId('hl-1'),
    userId: 'user-1',
    headlineLabel: 'Old Label',
    summaryText: 'Old summary',
    createdAt: NOW,
    updatedAt: NOW
  });
}

describe('UpdateHeadline', () => {
  test('updates fields and returns ok result', async () => {
    const headline = makeHeadline();
    let saved: ResumeHeadline | undefined;

    const repo: ResumeHeadlineRepository = {
      findByIdOrFail: async (id: string) => {
        if (id !== 'hl-1') throw new Error('Not found');
        return headline;
      },
      findAllByUserId: async () => [],
      save: async (h: ResumeHeadline) => {
        saved = h;
      },
      delete: async () => {}
    };

    const useCase = new UpdateHeadline(repo);
    const result = await useCase.execute({
      headlineId: 'hl-1',
      headlineLabel: 'New Label',
      summaryText: 'New summary'
    });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.headlineLabel).toBe('New Label');
      expect(result.value.summaryText).toBe('New summary');
    }
    expect(saved).toBeDefined();
    expect(saved!.updatedAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  test('returns err when not found', async () => {
    const repo: ResumeHeadlineRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not found');
      },
      findAllByUserId: async () => [],
      save: async () => {},
      delete: async () => {}
    };

    const useCase = new UpdateHeadline(repo);
    const result = await useCase.execute({
      headlineId: 'nonexistent',
      headlineLabel: 'X',
      summaryText: 'X'
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('nonexistent');
    }
  });
});
