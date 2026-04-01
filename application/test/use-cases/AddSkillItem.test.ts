import { describe, expect, test } from 'bun:test';
import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import { AddSkillItem } from '../../src/use-cases/AddSkillItem.js';

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

describe('AddSkillItem', () => {
  test('returns error when category not found', async () => {
    const repo = createMockSkillCategoryRepository();
    const uc = new AddSkillItem(repo);
    const result = await uc.execute({ categoryId: 'nonexistent', name: 'TS', ordinal: 0 });
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
    const result = await uc.execute({ categoryId: category.id.value, name: 'TypeScript', ordinal: 2 });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.name).toBe('TypeScript');
      expect(result.value.ordinal).toBe(2);
      expect(result.value.id).toBeTruthy();
    }
    expect(category.items).toHaveLength(1);
  });
});
