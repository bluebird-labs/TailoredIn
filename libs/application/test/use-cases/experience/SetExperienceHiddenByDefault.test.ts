import { EntityNotFoundError, Experience, type ExperienceRepository } from '@tailoredin/domain';
import { SetExperienceHiddenByDefault } from '../../../src/use-cases/experience/SetExperienceHiddenByDefault.js';

const makeExperience = (hiddenByDefault = false) =>
  new Experience({
    id: 'exp-1',
    profileId: 'profile-1',
    title: 'Engineer',
    companyName: 'Acme Corp',
    companyWebsite: null,
    companyAccent: null,
    companyId: null,
    location: 'NYC',
    startDate: '2022-01',
    endDate: '2023-01',
    summary: null,
    ordinal: 0,
    bulletMin: 2,
    bulletMax: 5,
    hiddenByDefault,
    createdAt: new Date(),
    updatedAt: new Date()
  });

describe('SetExperienceHiddenByDefault', () => {
  test('flips hiddenByDefault to true and saves', async () => {
    const experience = makeExperience(false);
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };

    const useCase = new SetExperienceHiddenByDefault(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1', hiddenByDefault: true });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.hiddenByDefault).toBe(true);
    }
    expect(experience.hiddenByDefault).toBe(true);
    expect(experienceRepo.save).toHaveBeenCalledWith(experience);
  });

  test('flips hiddenByDefault to false and saves', async () => {
    const experience = makeExperience(true);
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };

    const useCase = new SetExperienceHiddenByDefault(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1', hiddenByDefault: false });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.hiddenByDefault).toBe(false);
    }
    expect(experience.hiddenByDefault).toBe(false);
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

    const useCase = new SetExperienceHiddenByDefault(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1', hiddenByDefault: true });

    expect(result.isOk).toBe(false);
    expect(experienceRepo.save).not.toHaveBeenCalled();
  });
});
