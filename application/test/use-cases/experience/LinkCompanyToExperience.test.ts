import { describe, expect, mock, test } from 'bun:test';
import {
  Company,
  CompanyId,
  type CompanyRepository,
  EntityNotFoundError,
  Experience,
  ExperienceId,
  type ExperienceRepository
} from '@tailoredin/domain';
import { LinkCompanyToExperience } from '../../../src/use-cases/experience/LinkCompanyToExperience.js';

const makeExperience = () =>
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
    accomplishments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

const makeCompany = () =>
  new Company({
    id: 'company-1',
    name: 'Acme Corp',
    description: null,
    website: 'https://acme.com',
    logoUrl: null,
    linkedinLink: null,
    businessType: null,
    industry: null,
    stage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

describe('LinkCompanyToExperience', () => {
  test('links a company to an experience', async () => {
    const experience = makeExperience();
    const company = makeCompany();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => Promise.resolve(experience)),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: mock(() => Promise.resolve(company))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.companyId).toBe('company-1');
      expect(result.value.company).not.toBeNull();
      expect(result.value.company!.name).toBe('Acme Corp');
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
    const companyRepo: Partial<CompanyRepository> = {
      findById: mock(() => Promise.resolve(null))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(false);
  });

  test('returns error when company not found', async () => {
    const experience = makeExperience();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => Promise.resolve(experience)),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: mock(() => Promise.resolve(null))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(false);
  });
});
