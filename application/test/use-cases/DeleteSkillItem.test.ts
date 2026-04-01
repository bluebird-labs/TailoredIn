import { describe, expect, test } from 'bun:test';
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import { DeleteSkillItem } from '../../src/use-cases/DeleteSkillItem.js';

function createMockSkillCategoryRepository(overrides: Partial<SkillCategoryRepository> = {}): SkillCategoryRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findByItemIdOrFail: async () => {
      throw new Error('not found');
    },
    findAll: async () => [],
    save: async () => {},
    delete: async () => {},
    ...overrides
  };
}

function makeCategoryWithItem() {
  const category = SkillCategory.create({
    profileId: 'profile-1',
    name: 'Backend',
    ordinal: 0
  });
  const item = category.addItem({ name: 'ToRemove', ordinal: 0 });
  return { category, item };
}

describe('DeleteSkillItem', () => {
  test('returns error when item not found', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new DeleteSkillItem(repo);
    const result = await uc.execute({ itemId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Skill item not found');
    }
  });

  test('removes and saves', async () => {
    const { category, item } = makeCategoryWithItem();
    let saved = false;
    const repo = createMockSkillCategoryRepository({
      findByItemIdOrFail: async () => category,
      save: async () => {
        saved = true;
      }
    });
    const uc = new DeleteSkillItem(repo);
    const result = await uc.execute({ itemId: item.id.value });

    expect(result.isOk).toBe(true);
    expect(category.items).toHaveLength(0);
    expect(saved).toBe(true);
  });
});
