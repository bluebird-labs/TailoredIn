import { describe, expect, test } from 'bun:test';
import { ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';
import { AddSkillItem } from '../../src/use-cases/AddSkillItem.js';

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

describe('AddSkillItem', () => {
  test('returns error when category not found', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new AddSkillItem(repo);
    const result = await uc.execute({ categoryId: 'nonexistent', skillName: 'TS', ordinal: 0 });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Skill category not found');
    }
  });

  test('adds item and returns DTO', async () => {
    const category = makeCategory();
    const repo = createMockSkillCategoryRepository({
      findByIdOrFail: async () => category
    });
    const uc = new AddSkillItem(repo);
    const result = await uc.execute({ categoryId: category.id.value, skillName: 'TypeScript', ordinal: 2 });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.skillName).toBe('TypeScript');
      expect(result.value.ordinal).toBe(2);
      expect(result.value.id).toBeTruthy();
    }
    expect(category.items).toHaveLength(1);
  });
});
