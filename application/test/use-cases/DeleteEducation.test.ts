import { describe, expect, test } from 'bun:test';
import type { ResumeEducationRepository } from '@tailoredin/domain';
import { DeleteEducation } from '../../src/use-cases/DeleteEducation.js';

describe('DeleteEducation', () => {
  test('returns ok when delete succeeds', async () => {
    let deletedId: string | undefined;

    const repo: ResumeEducationRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not implemented');
      },
      findAllByUserId: async () => [],
      save: async () => {},
      delete: async (id: string) => {
        deletedId = id;
      }
    };

    const useCase = new DeleteEducation(repo);
    const result = await useCase.execute({ educationId: 'edu-1' });

    expect(result.isOk).toBe(true);
    expect(deletedId).toBe('edu-1');
  });

  test('returns err when not found', async () => {
    const repo: ResumeEducationRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not implemented');
      },
      findAllByUserId: async () => [],
      save: async () => {},
      delete: async () => {
        throw new Error('Not found');
      }
    };

    const useCase = new DeleteEducation(repo);
    const result = await useCase.execute({ educationId: 'nonexistent' });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('nonexistent');
    }
  });
});
