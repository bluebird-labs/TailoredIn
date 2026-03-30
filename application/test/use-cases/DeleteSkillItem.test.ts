import { describe, expect, test } from 'bun:test';
import { ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';
import { DeleteSkillItem } from '../../src/use-cases/DeleteSkillItem.js';

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
  const item = category.addItem({ skillName: 'ToRemove', ordinal: 0 });
  return { category, item };
}

describe('DeleteSkillItem', () => {
  test('returns error when category not found', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new DeleteSkillItem(repo);
    const result = await uc.execute({ categoryId: 'nonexistent', itemId: 'i1' });
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
    const uc = new DeleteSkillItem(repo);
    const result = await uc.execute({ categoryId: category.id.value, itemId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Skill item not found');
    }
  });

  test('removes and saves', async () => {
    const { category, item } = makeCategoryWithItem();
    let saved = false;
    const repo = createMockSkillCategoryRepository({
      findByIdOrFail: async () => category,
      save: async () => {
        saved = true;
      }
    });
    const uc = new DeleteSkillItem(repo);
    const result = await uc.execute({ categoryId: category.id.value, itemId: item.id.value });

    expect(result.isOk).toBe(true);
    expect(category.items).toHaveLength(0);
    expect(saved).toBe(true);
  });
});
