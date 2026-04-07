import { describe, expect, mock, test } from 'bun:test';
import { EntityNotFoundError, Experience, ExperienceId, type ExperienceRepository } from '@tailoredin/domain';
import { UnlinkCompanyFromExperience } from '../../../src/use-cases/experience/UnlinkCompanyFromExperience.js';

const makeLinkedExperience = () =>
  new Experience({
    id: new ExperienceId('exp-1'),
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
    accomplishments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

describe('UnlinkCompanyFromExperience', () => {
  test('unlinks a company from an experience', async () => {
    const experience = makeLinkedExperience();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => Promise.resolve(experience)),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
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
      findByIdOrFail: mock(() => {
        throw new EntityNotFoundError('Experience', 'exp-1');
      }),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };

    const useCase = new UnlinkCompanyFromExperience(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1' });

    expect(result.isOk).toBe(false);
  });
});
