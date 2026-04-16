import { describe, expect, mock, test } from 'bun:test';
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import { ListSkillCategories } from '../../../src/use-cases/skill/ListSkillCategories.js';

const makeCategory = (overrides: Partial<ConstructorParameters<typeof SkillCategory>[0]> = {}) =>
  new SkillCategory({
    id: 'cat-aaaa-1111-2222-3333-444444444444',
    label: 'Programming Languages',
    normalizedLabel: 'programming-languages',
    parentId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

describe('ListSkillCategories', () => {
  test('returns categories from repository', async () => {
    const catA = makeCategory({ id: 'cat-a', label: 'Backend', normalizedLabel: 'backend' });
    const catB = makeCategory({ id: 'cat-b', label: 'Frontend', normalizedLabel: 'frontend' });

    const categoryRepo: Partial<SkillCategoryRepository> = {
      findAll: mock(() => Promise.resolve([catA, catB]))
    };

    const useCase = new ListSkillCategories(categoryRepo as SkillCategoryRepository);
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Backend');
    expect(result[1].label).toBe('Frontend');
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
