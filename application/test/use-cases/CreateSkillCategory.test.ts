import { describe, expect, test } from 'bun:test';
import type { SkillCategory, SkillCategoryRepository } from '@tailoredin/domain';
import { CreateSkillCategory } from '../../src/use-cases/CreateSkillCategory.js';

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

describe('CreateSkillCategory', () => {
  test('creates category with items and saves', async () => {
    let saved: SkillCategory | null = null;
    const repo = createMockSkillCategoryRepository({
      save: async c => {
        saved = c;
      }
    });
    const uc = new CreateSkillCategory(repo);
    const result = await uc.execute({
      profileId: 'profile-1',
      name: 'Backend',
      ordinal: 0,
      items: [
        { name: 'TypeScript', ordinal: 0 },
        { name: 'Node.js', ordinal: 1 }
      ]
    });

    expect(saved).not.toBeNull();
    expect(result.name).toBe('Backend');
    expect(result.ordinal).toBe(0);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('TypeScript');
    expect(result.items[1].name).toBe('Node.js');
    expect(result.id).toBeTruthy();
  });
});
