import { describe, expect, test } from 'bun:test';
import { ResumeEducation, ResumeEducationId, type ResumeEducationRepository } from '@tailoredin/domain';
import { UpdateEducation } from '../../src/use-cases/UpdateEducation.js';

const NOW = new Date('2025-01-01');

function makeEducation(): ResumeEducation {
  return new ResumeEducation({
    id: new ResumeEducationId('edu-1'),
    userId: 'user-1',
    degreeTitle: 'B.S. Computer Science',
    institutionName: 'MIT',
    graduationYear: '2020',
    locationLabel: 'Cambridge, MA',
    ordinal: 0,
    createdAt: NOW,
    updatedAt: NOW
  });
}

describe('UpdateEducation', () => {
  test('updates fields and returns ok result', async () => {
    const education = makeEducation();
    let saved: ResumeEducation | undefined;

    const repo: ResumeEducationRepository = {
      findByIdOrFail: async (id: string) => {
        if (id !== 'edu-1') throw new Error('Not found');
        return education;
      },
      findAllByUserId: async () => [],
      save: async (e: ResumeEducation) => {
        saved = e;
      },
      delete: async () => {}
    };

    const useCase = new UpdateEducation(repo);
    const result = await useCase.execute({
      educationId: 'edu-1',
      degreeTitle: 'M.S. Data Science',
      institutionName: 'Stanford',
      graduationYear: '2022',
      locationLabel: 'Palo Alto, CA',
      ordinal: 1
    });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.degreeTitle).toBe('M.S. Data Science');
      expect(result.value.institutionName).toBe('Stanford');
      expect(result.value.graduationYear).toBe('2022');
      expect(result.value.ordinal).toBe(1);
    }
    expect(saved).toBeDefined();
    expect(saved!.updatedAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  test('returns err when not found', async () => {
    const repo: ResumeEducationRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not found');
      },
      findAllByUserId: async () => [],
      save: async () => {},
      delete: async () => {}
    };

    const useCase = new UpdateEducation(repo);
    const result = await useCase.execute({
      educationId: 'nonexistent',
      degreeTitle: 'X',
      institutionName: 'X',
      graduationYear: '2020',
      locationLabel: 'X',
      ordinal: 0
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('nonexistent');
    }
  });
});
