import { describe, expect, test } from 'bun:test';
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import { ListSkillCategories } from '../../src/use-cases/ListSkillCategories.js';

function createMockSkillCategoryRepository(overrides: Partial<SkillCategoryRepository> = {}): SkillCategoryRepository {
  return {
    findAll: async () => [],
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findByItemIdOrFail: async () => {
      throw new Error('not found');
    },
    save: async () => {},
    delete: async () => {},
    ...overrides
  };
}

describe('ListSkillCategories', () => {
  test('returns mapped DTOs', async () => {
    const category = SkillCategory.create({
      profileId: 'profile-1',
      name: 'Backend',
      ordinal: 0
    });
    category.addItem({ name: 'TypeScript', ordinal: 0 });

    const repo = createMockSkillCategoryRepository({
      findAll: async () => [category]
    });
    const uc = new ListSkillCategories(repo);
    const result = await uc.execute();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Backend');
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].name).toBe('TypeScript');
    expect(result[0].id).toBe(category.id.value);
  });

  test('returns empty array when no categories', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new ListSkillCategories(repo);
    const result = await uc.execute();

    expect(result).toHaveLength(0);
  });
});
