import { EntityNotFoundError, Experience, type ExperienceRepository } from '@tailoredin/domain';
import { UnlinkCompanyFromExperience } from '../../../src/use-cases/experience/UnlinkCompanyFromExperience.js';

const makeLinkedExperience = () =>
  new Experience({
    id: 'exp-1',
    profileId: 'profile-1',
    title: 'Engineer',
    companyName: 'Acme Corp',
    companyWebsite: null,
    companyAccent: null,
    companyId: 'company-1',
    location: 'NYC',
    startDate: '2022-01',
    endDate: '2023-01',
    summary: null,
    ordinal: 0,
    bulletMin: 2,
    bulletMax: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  });

describe('UnlinkCompanyFromExperience', () => {
  test('unlinks a company from an experience', async () => {
    const experience = makeLinkedExperience();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };

    const useCase = new UnlinkCompanyFromExperience(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1' });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.companyId).toBeNull();
      expect(result.value.company).toBeNull();
    }
    expect(experienceRepo.save).toHaveBeenCalled();
  });

  test('returns error when experience not found', async () => {
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => {
        throw new EntityNotFoundError('Experience', 'exp-1');
      }),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };

    const useCase = new UnlinkCompanyFromExperience(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1' });

    expect(result.isOk).toBe(false);
  });
});
