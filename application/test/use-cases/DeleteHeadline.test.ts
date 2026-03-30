import { describe, expect, test } from 'bun:test';
import type { ResumeHeadlineRepository } from '@tailoredin/domain';
import { DeleteHeadline } from '../../src/use-cases/DeleteHeadline.js';

describe('DeleteHeadline', () => {
  test('returns ok when delete succeeds', async () => {
    let deletedId: string | undefined;

    const repo: ResumeHeadlineRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not implemented');
      },
      findAllByUserId: async () => [],
      save: async () => {},
      delete: async (id: string) => {
        deletedId = id;
      }
    };

    const useCase = new DeleteHeadline(repo);
    const result = await useCase.execute({ headlineId: 'hl-1' });

    expect(result.isOk).toBe(true);
    expect(deletedId).toBe('hl-1');
  });

  test('returns err when not found', async () => {
    const repo: ResumeHeadlineRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not implemented');
      },
      findAllByUserId: async () => [],
      save: async () => {},
      delete: async () => {
        throw new Error('Not found');
      }
    };

    const useCase = new DeleteHeadline(repo);
    const result = await useCase.execute({ headlineId: 'nonexistent' });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('nonexistent');
    }
  });
});
