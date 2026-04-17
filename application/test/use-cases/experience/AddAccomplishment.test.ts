import { Experience, type ExperienceRepository } from '@tailoredin/domain';
import { AddAccomplishment } from '../../../src/use-cases/experience/AddAccomplishment.js';

const fakeExperience = Experience.create({
  profileId: 'p1',
  title: 'Eng',
  companyName: 'ACME',
  companyWebsite: null,
  companyAccent: null,
  location: 'Remote',
  startDate: '2020',
  endDate: '2023',
  summary: null,
  ordinal: 0
});

const mockRepo = {
  findByIdOrFail: jest.fn(async () => fakeExperience),
  findAll: jest.fn(async () => []),
  save: jest.fn(async () => {}),
  delete: jest.fn(async () => {})
};

describe('AddAccomplishment', () => {
  it('adds accomplishment and returns dto', async () => {
    const useCase = new AddAccomplishment(mockRepo as unknown as ExperienceRepository);
    const result = await useCase.execute({
      experienceId: fakeExperience.id,
      title: 'Billing sharding',
      narrative: 'Led hash-based sharding project.',
      ordinal: 0
    });
    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.title).toBe('Billing sharding');
    }
  });
});
