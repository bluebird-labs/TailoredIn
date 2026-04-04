import { describe, expect, test } from 'bun:test';
import type { Headline, HeadlineRepository } from '@tailoredin/domain';
import { CreateHeadline } from '../../../src/use-cases/headline/CreateHeadline.js';

function mockHeadlineRepo(onSave?: (h: Headline) => void): HeadlineRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('Not implemented');
    },
    findAll: async () => [],
    save: async (h: Headline) => {
      onSave?.(h);
    },
    delete: async () => {}
  };
}

describe('CreateHeadline', () => {
  test('creates headline and returns DTO with generated id', async () => {
    let saved: Headline | undefined;

    const useCase = new CreateHeadline(
      mockHeadlineRepo(h => {
        saved = h;
      })
    );

    const dto = await useCase.execute({
      profileId: 'profile-1',
      label: 'Senior Engineer',
      summaryText: 'Full-stack engineer with 10 years of experience'
    });

    expect(dto.id).toBeString();
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.label).toBe('Senior Engineer');
    expect(dto.summaryText).toBe('Full-stack engineer with 10 years of experience');
    expect(saved).toBeDefined();
  });
});
