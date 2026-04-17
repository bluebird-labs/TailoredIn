import {
  Company,
  type CompanyRepository,
  EntityNotFoundError,
  Experience,
  type ExperienceRepository,
  type SkillRepository
} from '@tailoredin/domain';
import { GetExperience } from '../../../src/use-cases/experience/GetExperience.js';

const makeExperience = (overrides: Partial<ConstructorParameters<typeof Experience>[0]> = {}) =>
  new Experience({
    id: 'exp-aaaa-1111-2222-3333-444444444444',
    profileId: 'profile-1',
    title: 'Software Engineer',
    companyName: 'Acme Corp',
    companyWebsite: 'https://acme.com',
    companyAccent: null,
    companyId: null,
    location: 'New York, NY',
    startDate: '2022-01',
    endDate: '2023-06',
    summary: 'Built cool things',
    ordinal: 0,
    bulletMin: 2,
    bulletMax: 5,
    accomplishments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

const makeCompany = () =>
  new Company({
    id: 'company-bbbb-1111-2222-3333-444444444444',
    name: 'Acme Corp',
    description: 'A great company',
    website: 'https://acme.com',
    logoUrl: null,
    linkedinLink: null,
    businessType: null,
    industry: null,
    stage: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });

const mockSkillRepo: Partial<SkillRepository> = {
  findByIds: jest.fn(() => Promise.resolve([]))
};

describe('GetExperience', () => {
  test('returns an experience DTO with linked company when companyId is set', async () => {
    const company = makeCompany();
    const experience = makeExperience({ companyId: company.id });

    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(company))
    };

    const useCase = new GetExperience(
      experienceRepo,
      companyRepo as CompanyRepository,
      mockSkillRepo as SkillRepository
    );
    const result = await useCase.execute({ experienceId: 'exp-aaaa-1111-2222-3333-444444444444' });

    expect(result.id).toBe('exp-aaaa-1111-2222-3333-444444444444');
    expect(result.title).toBe('Software Engineer');
    expect(result.companyId).toBe('company-bbbb-1111-2222-3333-444444444444');
    expect(result.company).not.toBeNull();
    expect(result.company!.name).toBe('Acme Corp');
    expect(companyRepo.findById).toHaveBeenCalled();
  });

  test('returns experience with null company when companyId is null', async () => {
    const experience = makeExperience({ companyId: null });

    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(null))
    };

    const useCase = new GetExperience(
      experienceRepo,
      companyRepo as CompanyRepository,
      mockSkillRepo as SkillRepository
    );
    const result = await useCase.execute({ experienceId: 'exp-aaaa-1111-2222-3333-444444444444' });

    expect(result.id).toBe('exp-aaaa-1111-2222-3333-444444444444');
    expect(result.companyId).toBeNull();
    expect(result.company).toBeNull();
    expect(companyRepo.findById).not.toHaveBeenCalled();
  });

  test('throws EntityNotFoundError when experience does not exist', async () => {
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => {
        throw new EntityNotFoundError('Experience', 'exp-aaaa-1111-2222-3333-444444444444');
      }),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(null))
    };

    const useCase = new GetExperience(
      experienceRepo,
      companyRepo as CompanyRepository,
      mockSkillRepo as SkillRepository
    );

    await expect(useCase.execute({ experienceId: 'exp-aaaa-1111-2222-3333-444444444444' })).rejects.toThrow(
      EntityNotFoundError
    );
  });
});
