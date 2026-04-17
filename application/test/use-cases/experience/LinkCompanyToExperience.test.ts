import {
  Company,
  type CompanyRepository,
  EntityNotFoundError,
  Experience,
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
    bulletMin: 2,
    bulletMax: 5,
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
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(company))
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
      findByIdOrFail: jest.fn(() => {
        throw new EntityNotFoundError('Experience', 'exp-1');
      }),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(null))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(false);
  });

  test('returns error when company not found', async () => {
    const experience = makeExperience();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(null))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(false);
  });
});
