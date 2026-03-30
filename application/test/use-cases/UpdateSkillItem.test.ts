import { describe, expect, test } from 'bun:test';
import { ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';
import { UpdateSkillItem } from '../../src/use-cases/UpdateSkillItem.js';

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

function makeCategoryWithItem() {
  const category = ResumeSkillCategory.create({
    userId: 'user-1',
    categoryName: 'Backend',
    ordinal: 0,
    items: []
  });
  const item = category.addItem({ skillName: 'Original', ordinal: 0 });
  return { category, item };
}

describe('UpdateSkillItem', () => {
  test('returns error when category not found', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new UpdateSkillItem(repo);
    const result = await uc.execute({ categoryId: 'nonexistent', itemId: 'i1', skillName: 'X' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Skill category not found');
    }
  });

  test('returns error when item not found', async () => {
    const { category } = makeCategoryWithItem();
    const repo = createMockSkillCategoryRepository({
      findByIdOrFail: async () => category
    });
    const uc = new UpdateSkillItem(repo);
    const result = await uc.execute({ categoryId: category.id.value, itemId: 'nonexistent', skillName: 'X' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Skill item not found');
    }
  });

  test('updates and saves', async () => {
    const { category, item } = makeCategoryWithItem();
    let saved = false;
    const repo = createMockSkillCategoryRepository({
      findByIdOrFail: async () => category,
      save: async () => {
        saved = true;
      }
    });
    const uc = new UpdateSkillItem(repo);
    const result = await uc.execute({
      categoryId: category.id.value,
      itemId: item.id.value,
      skillName: 'Updated'
    });

    expect(result.isOk).toBe(true);
    expect(item.skillName).toBe('Updated');
    expect(saved).toBe(true);
  });
});
