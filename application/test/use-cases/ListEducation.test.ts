import { describe, expect, test } from 'bun:test';
import { ResumeEducation, ResumeEducationId, type ResumeEducationRepository } from '@tailoredin/domain';
import { ListEducation } from '../../src/use-cases/ListEducation.js';

const NOW = new Date('2025-01-01');

function makeEducation(ordinal: number, degreeTitle: string): ResumeEducation {
  return new ResumeEducation({
    id: ResumeEducationId.generate(),
    userId: 'user-1',
    degreeTitle,
    institutionName: 'MIT',
    graduationYear: '2020',
    locationLabel: 'Cambridge, MA',
    ordinal,
    createdAt: NOW,
    updatedAt: NOW
  });
}

function mockRepo(entries: ResumeEducation[]): ResumeEducationRepository {
  return {
    findByIdOrFail: async () => entries[0]!,
    findAllByUserId: async () => entries,
    save: async () => {},
    delete: async () => {}
  };
}

describe('ListEducation', () => {
  test('returns DTOs for all entries', async () => {
    const entries = [makeEducation(0, 'B.S. Computer Science'), makeEducation(1, 'M.S. Data Science')];
    const useCase = new ListEducation(mockRepo(entries));

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toHaveLength(2);
    expect(result[0]!.degreeTitle).toBe('B.S. Computer Science');
    expect(result[0]!.ordinal).toBe(0);
    expect(result[1]!.degreeTitle).toBe('M.S. Data Science');
    expect(result[1]!.ordinal).toBe(1);
  });

  test('returns empty array when no entries', async () => {
    const useCase = new ListEducation(mockRepo([]));

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toHaveLength(0);
  });
});
