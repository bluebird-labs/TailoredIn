import { describe, expect, test } from 'bun:test';
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import { UpdateSkillCategory } from '../../src/use-cases/UpdateSkillCategory.js';

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

function makeCategory() {
  return SkillCategory.create({
    profileId: 'profile-1',
    name: 'Backend',
    ordinal: 0
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
      name: 'Frontend',
      ordinal: 5
    });

    expect(result.isOk).toBe(true);
    expect(category.name).toBe('Frontend');
    expect(category.ordinal).toBe(5);
    expect(saved).toBe(true);
  });
});
