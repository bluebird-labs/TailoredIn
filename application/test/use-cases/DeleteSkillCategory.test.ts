import { describe, expect, test } from 'bun:test';
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import { DeleteSkillCategory } from '../../src/use-cases/DeleteSkillCategory.js';

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

describe('DeleteSkillCategory', () => {
  test('returns error when not found', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new DeleteSkillCategory(repo);
    const result = await uc.execute({ categoryId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Skill category not found');
    }
  });

  test('deletes', async () => {
    const category = SkillCategory.create({
      profileId: 'profile-1',
      name: 'Backend',
      ordinal: 0
    });
    let deletedId: string | null = null;
    const repo = createMockSkillCategoryRepository({
      findByIdOrFail: async () => category,
      delete: async id => {
        deletedId = id;
      }
    });
    const uc = new DeleteSkillCategory(repo);
    const result = await uc.execute({ categoryId: category.id.value });
    expect(result.isOk).toBe(true);
    expect(deletedId).toBe(category.id.value);
  });
});
