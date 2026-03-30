import { describe, expect, test } from 'bun:test';
import { ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';
import { UpdateSkillCategory } from '../../src/use-cases/UpdateSkillCategory.js';

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

function makeCategory() {
  return ResumeSkillCategory.create({
    userId: 'user-1',
    categoryName: 'Backend',
    ordinal: 0,
    items: []
  });
}

describe('UpdateSkillCategory', () => {
  test('returns error when not found', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new UpdateSkillCategory(repo);
    const result = await uc.execute({ categoryId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Skill category not found');
    }
  });

  test('updates fields and saves', async () => {
    const category = makeCategory();
    let saved = false;
    const repo = createMockSkillCategoryRepository({
      findByIdOrFail: async () => category,
      save: async () => {
        saved = true;
      }
    });
    const uc = new UpdateSkillCategory(repo);
    const result = await uc.execute({
      categoryId: category.id.value,
      categoryName: 'Frontend',
      ordinal: 5
    });

    expect(result.isOk).toBe(true);
    expect(category.categoryName).toBe('Frontend');
    expect(category.ordinal).toBe(5);
    expect(saved).toBe(true);
  });
});
