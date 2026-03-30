import { describe, expect, test } from 'bun:test';
import type { ResumeHeadline, ResumeHeadlineRepository } from '@tailoredin/domain';
import { CreateHeadline } from '../../src/use-cases/CreateHeadline.js';

describe('CreateHeadline', () => {
  test('creates headline and returns DTO with generated id', async () => {
    let saved: ResumeHeadline | undefined;

    const repo: ResumeHeadlineRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not implemented');
      },
      findAllByUserId: async () => [],
      save: async (h: ResumeHeadline) => {
        saved = h;
      },
      delete: async () => {}
    };

    const useCase = new CreateHeadline(repo);
    const dto = await useCase.execute({
      userId: 'user-1',
      headlineLabel: 'Senior Engineer',
      summaryText: 'Full-stack engineer with 10 years of experience'
    });

    expect(dto.id).toBeString();
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.headlineLabel).toBe('Senior Engineer');
    expect(dto.summaryText).toBe('Full-stack engineer with 10 years of experience');
    expect(saved).toBeDefined();
  });
});
