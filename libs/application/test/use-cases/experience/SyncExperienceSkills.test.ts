import {
  type CompanyRepository,
  Experience,
  type ExperienceRepository,
  Skill,
  SkillKind,
  type SkillRepository
} from '@tailoredin/domain';
import { SyncExperienceSkills } from '../../../src/use-cases/experience/SyncExperienceSkills.js';

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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

const makeSkill = (overrides: Partial<ConstructorParameters<typeof Skill>[0]> = {}) =>
  new Skill({
    id: 'skill-aaaa-1111-2222-3333-444444444444',
    label: 'TypeScript',
    normalizedLabel: 'typescript',
    kind: SkillKind.PROGRAMMING_LANGUAGE,
    categoryId: null,
    description: null,
    aliases: [],
    technicalDomains: [],
    conceptualAspects: [],
    architecturalPatterns: [],
    mindName: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

describe('SyncExperienceSkills', () => {
  test('syncs skills on an experience and returns updated DTO', async () => {
    const experience = makeExperience();
    const skillA = makeSkill({ id: 'skill-a', label: 'TypeScript' });
    const skillB = makeSkill({ id: 'skill-b', label: 'React', kind: SkillKind.TOOL });

    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const skillRepo: Partial<SkillRepository> = {
      findByIds: jest.fn(() => Promise.resolve([skillA, skillB]))
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(null))
    };

    const useCase = new SyncExperienceSkills(
      experienceRepo,
      skillRepo as SkillRepository,
      companyRepo as CompanyRepository
    );
    const result = await useCase.execute({
      experienceId: experience.id,
      skillIds: ['skill-a', 'skill-b']
    });

    expect(result.id).toBe(experience.id);
    expect(result.skills).toHaveLength(2);
    expect(result.skills.map(s => s.skill.label).sort()).toEqual(['React', 'TypeScript']);
    expect(experienceRepo.save).toHaveBeenCalled();
  });

  test('throws when a skill ID does not exist', async () => {
    const experience = makeExperience();

    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const skillRepo: Partial<SkillRepository> = {
      findByIds: jest.fn(() => Promise.resolve([]))
    };
    const companyRepo: Partial<CompanyRepository> = {};

    const useCase = new SyncExperienceSkills(
      experienceRepo,
      skillRepo as SkillRepository,
      companyRepo as CompanyRepository
    );

    await expect(useCase.execute({ experienceId: experience.id, skillIds: ['nonexistent-id'] })).rejects.toThrow(
      'Skills not found: nonexistent-id'
    );
  });

  test('clears all skills when given empty array', async () => {
    const experience = makeExperience();
    experience.addSkill('skill-a');

    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: jest.fn(() => Promise.resolve(experience)),
      findAll: jest.fn(() => Promise.resolve([])),
      save: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve())
    };
    const skillRepo: Partial<SkillRepository> = {
      findByIds: jest.fn(() => Promise.resolve([]))
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: jest.fn(() => Promise.resolve(null))
    };

    const useCase = new SyncExperienceSkills(
      experienceRepo,
      skillRepo as SkillRepository,
      companyRepo as CompanyRepository
    );
    const result = await useCase.execute({
      experienceId: experience.id,
      skillIds: []
    });

    expect(result.skills).toHaveLength(0);
    expect(experienceRepo.save).toHaveBeenCalled();
  });
});
