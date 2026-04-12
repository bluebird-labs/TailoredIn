import { describe, expect, mock, test } from 'bun:test';
import {
  Skill,
  SkillCategory,
  type SkillCategoryRepository,
  type SkillRepository,
  SkillType
} from '@tailoredin/domain';
import { SearchSkills } from '../../../src/use-cases/skill/SearchSkills.js';

const makeSkill = (overrides: Partial<ConstructorParameters<typeof Skill>[0]> = {}) =>
  new Skill({
    id: 'skill-aaaa-1111-2222-3333-444444444444',
    label: 'TypeScript',
    normalizedLabel: 'typescript',
    type: SkillType.LANGUAGE,
    categoryId: null,
    description: 'A typed superset of JavaScript',
    aliases: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

const makeCategory = (overrides: Partial<ConstructorParameters<typeof SkillCategory>[0]> = {}) =>
  new SkillCategory({
    id: 'cat-aaaa-1111-2222-3333-444444444444',
    label: 'Programming Languages',
    normalizedLabel: 'programming-languages',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

describe('SearchSkills', () => {
  test('returns skills with categories populated', async () => {
    const category = makeCategory();
    const skill = makeSkill({ categoryId: category.id });

    const skillRepo: Partial<SkillRepository> = {
      search: mock(() => Promise.resolve([skill]))
    };
    const categoryRepo: Partial<SkillCategoryRepository> = {
      findByIdOrFail: mock(() => Promise.resolve(category))
    };

    const useCase = new SearchSkills(skillRepo as SkillRepository, categoryRepo as SkillCategoryRepository);
    const result = await useCase.execute({ query: 'type' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(skill.id);
    expect(result[0].label).toBe('TypeScript');
    expect(result[0].type).toBe(SkillType.LANGUAGE);
    expect(result[0].category).not.toBeNull();
    expect(result[0].category!.label).toBe('Programming Languages');
    expect(skillRepo.search).toHaveBeenCalledWith('type', 20);
  });

  test('uses default limit of 20 when not specified', async () => {
    const skillRepo: Partial<SkillRepository> = {
      search: mock(() => Promise.resolve([]))
    };
    const categoryRepo: Partial<SkillCategoryRepository> = {};

    const useCase = new SearchSkills(skillRepo as SkillRepository, categoryRepo as SkillCategoryRepository);
    await useCase.execute({ query: 'react' });

    expect(skillRepo.search).toHaveBeenCalledWith('react', 20);
  });

  test('respects custom limit', async () => {
    const skillRepo: Partial<SkillRepository> = {
      search: mock(() => Promise.resolve([]))
    };
    const categoryRepo: Partial<SkillCategoryRepository> = {};

    const useCase = new SearchSkills(skillRepo as SkillRepository, categoryRepo as SkillCategoryRepository);
    await useCase.execute({ query: 'react', limit: 5 });

    expect(skillRepo.search).toHaveBeenCalledWith('react', 5);
  });

  test('returns skills without category when categoryId is null', async () => {
    const skill = makeSkill({ categoryId: null });

    const skillRepo: Partial<SkillRepository> = {
      search: mock(() => Promise.resolve([skill]))
    };
    const categoryRepo: Partial<SkillCategoryRepository> = {
      findByIdOrFail: mock(() => Promise.reject(new Error('should not be called')))
    };

    const useCase = new SearchSkills(skillRepo as SkillRepository, categoryRepo as SkillCategoryRepository);
    const result = await useCase.execute({ query: 'type' });

    expect(result).toHaveLength(1);
    expect(result[0].category).toBeNull();
    expect(categoryRepo.findByIdOrFail).not.toHaveBeenCalled();
  });
});
