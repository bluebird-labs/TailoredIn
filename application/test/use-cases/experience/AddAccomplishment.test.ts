import { describe, expect, it, mock } from 'bun:test';
import { Experience } from '@tailoredin/domain';
import { AddAccomplishment } from '../../../src/use-cases/experience/AddAccomplishment.js';

const fakeExperience = Experience.create({
  profileId: 'p1',
  title: 'Eng',
  companyName: 'ACME',
  companyWebsite: null,
  location: 'Remote',
  startDate: '2020',
  endDate: '2023',
  summary: null,
  ordinal: 0,
});

const mockRepo = {
  findByIdOrFail: mock(async () => fakeExperience),
  findAll: mock(async () => []),
  save: mock(async () => {}),
  delete: mock(async () => {}),
};

describe('AddAccomplishment', () => {
  it('adds accomplishment and returns dto', async () => {
    const useCase = new AddAccomplishment(mockRepo as any);
    const result = await useCase.execute({
      experienceId: fakeExperience.id.value,
      title: 'Billing sharding',
      narrative: 'Led hash-based sharding project.',
      skillTags: ['performance'],
      ordinal: 0,
    });
    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.title).toBe('Billing sharding');
      expect(result.value.skillTags).toEqual(['performance']);
    }
  });
});
