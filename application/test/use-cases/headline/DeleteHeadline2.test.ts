import { describe, expect, test } from 'bun:test';
import type { HeadlineRepository } from '@tailoredin/domain';
import { DeleteHeadline2 } from '../../../src/use-cases/headline/DeleteHeadline2.js';

function mockHeadlineRepo(shouldThrow = false): HeadlineRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => [],
    save: async () => {},
    delete: async (id: string) => {
      if (shouldThrow) throw new Error(`Headline not found: ${id}`);
    }
  };
}

describe('DeleteHeadline2', () => {
  test('deletes headline and returns ok', async () => {
    const useCase = new DeleteHeadline2(mockHeadlineRepo(false));
    const result = await useCase.execute({ headlineId: 'some-id' });

    expect(result.isOk).toBe(true);
  });

  test('returns err when delete throws (headline not found)', async () => {
    const useCase = new DeleteHeadline2(mockHeadlineRepo(true));
    const result = await useCase.execute({ headlineId: 'nonexistent-id' });

    expect(result.isOk).toBe(false);
    if (result.isOk) return;
    expect(result.error.message).toContain('nonexistent-id');
  });
});
