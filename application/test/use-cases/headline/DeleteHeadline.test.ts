import { describe, expect, test } from 'bun:test';
import { EntityNotFoundError, type HeadlineRepository } from '@tailoredin/domain';
import { DeleteHeadline } from '../../../src/use-cases/headline/DeleteHeadline.js';

function mockHeadlineRepo(shouldThrow = false): HeadlineRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => [],
    save: async () => {},
    delete: async (id: string) => {
      if (shouldThrow) throw new EntityNotFoundError('Headline', id);
    }
  };
}

describe('DeleteHeadline', () => {
  test('deletes headline and returns ok', async () => {
    const useCase = new DeleteHeadline(mockHeadlineRepo(false));
    const result = await useCase.execute({ headlineId: 'some-id' });

    expect(result.isOk).toBe(true);
  });

  test('returns err when delete throws (headline not found)', async () => {
    const useCase = new DeleteHeadline(mockHeadlineRepo(true));
    const result = await useCase.execute({ headlineId: 'nonexistent-id' });

    expect(result.isOk).toBe(false);
    if (result.isOk) return;
    expect(result.error.message).toContain('nonexistent-id');
  });
});
