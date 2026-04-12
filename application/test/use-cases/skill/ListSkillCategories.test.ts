import { describe, expect, mock, test } from 'bun:test';
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import { ListSkillCategories } from '../../../src/use-cases/skill/ListSkillCategories.js';

const makeCategory = (overrides: Partial<ConstructorParameters<typeof SkillCategory>[0]> = {}) =>
  new SkillCategory({
    id: 'cat-aaaa-1111-2222-3333-444444444444',
    label: 'Programming Languages',
    normalizedLabel: 'programming languages',
    ordinal: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

describe('ListSkillCategories', () => {
  test('returns categories sorted by ordinal', async () => {
    const catB = makeCategory({ id: 'cat-b', label: 'Frameworks', normalizedLabel: 'frameworks', ordinal: 2 });
    const catA = makeCategory({ id: 'cat-a', label: 'Languages', normalizedLabel: 'languages', ordinal: 0 });
    const catC = makeCategory({ id: 'cat-c', label: 'Tools', normalizedLabel: 'tools', ordinal: 1 });

    const categoryRepo: Partial<SkillCategoryRepository> = {
      findAll: mock(() => Promise.resolve([catB, catA, catC]))
    };

    const useCase = new ListSkillCategories(categoryRepo as SkillCategoryRepository);
    const result = await useCase.execute();

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe('Languages');
    expect(result[0].ordinal).toBe(0);
    expect(result[1].label).toBe('Tools');
    expect(result[1].ordinal).toBe(1);
    expect(result[2].label).toBe('Frameworks');
    expect(result[2].ordinal).toBe(2);
  });

  test('returns empty array when no categories exist', async () => {
    const categoryRepo: Partial<SkillCategoryRepository> = {
      findAll: mock(() => Promise.resolve([]))
    };

    const useCase = new ListSkillCategories(categoryRepo as SkillCategoryRepository);
    const result = await useCase.execute();

    expect(result).toHaveLength(0);
  });
});
