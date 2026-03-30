import { describe, expect, test } from 'bun:test';
import { ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';
import { ListSkillCategories } from '../../src/use-cases/ListSkillCategories.js';

function createMockSkillCategoryRepository(
  overrides: Partial<ResumeSkillCategoryRepository> = {}
): ResumeSkillCategoryRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findAllByUserId: async () => [],
    save: async () => {},
    delete: async () => {},
    ...overrides
  };
}

describe('ListSkillCategories', () => {
  test('returns mapped DTOs', async () => {
    const category = ResumeSkillCategory.create({
      userId: 'user-1',
      categoryName: 'Backend',
      ordinal: 0,
      items: []
    });
    category.addItem({ skillName: 'TypeScript', ordinal: 0 });

    const repo = createMockSkillCategoryRepository({
      findAllByUserId: async () => [category]
    });
    const uc = new ListSkillCategories(repo);
    const result = await uc.execute({ userId: 'user-1' });

    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe('Backend');
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].skillName).toBe('TypeScript');
    expect(result[0].id).toBe(category.id.value);
  });
});
