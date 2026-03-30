import { describe, expect, test } from 'bun:test';
import type { ResumeEducation, ResumeEducationRepository } from '@tailoredin/domain';
import { CreateEducation } from '../../src/use-cases/CreateEducation.js';

describe('CreateEducation', () => {
  test('creates entry and returns DTO with generated id', async () => {
    let saved: ResumeEducation | undefined;

    const repo: ResumeEducationRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not implemented');
      },
      findAllByUserId: async () => [],
      save: async (e: ResumeEducation) => {
        saved = e;
      },
      delete: async () => {}
    };

    const useCase = new CreateEducation(repo);
    const dto = await useCase.execute({
      userId: 'user-1',
      degreeTitle: 'B.S. Computer Science',
      institutionName: 'MIT',
      graduationYear: '2020',
      locationLabel: 'Cambridge, MA',
      ordinal: 0
    });

    expect(dto.id).toBeString();
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.degreeTitle).toBe('B.S. Computer Science');
    expect(dto.institutionName).toBe('MIT');
    expect(dto.graduationYear).toBe('2020');
    expect(dto.locationLabel).toBe('Cambridge, MA');
    expect(dto.ordinal).toBe(0);
    expect(saved).toBeDefined();
  });
});
