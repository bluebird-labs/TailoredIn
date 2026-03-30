import { describe, expect, test } from 'bun:test';
import type { ResumeSkillCategory, ResumeSkillCategoryRepository } from '@tailoredin/domain';
import { CreateSkillCategory } from '../../src/use-cases/CreateSkillCategory.js';

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

describe('CreateSkillCategory', () => {
  test('creates category with items and saves', async () => {
    let saved: ResumeSkillCategory | null = null;
    const repo = createMockSkillCategoryRepository({
      save: async c => {
        saved = c;
      }
    });
    const uc = new CreateSkillCategory(repo);
    const result = await uc.execute({
      userId: 'user-1',
      categoryName: 'Backend',
      ordinal: 0,
      items: [
        { skillName: 'TypeScript', ordinal: 0 },
        { skillName: 'Node.js', ordinal: 1 }
      ]
    });

    expect(saved).not.toBeNull();
    expect(result.categoryName).toBe('Backend');
    expect(result.ordinal).toBe(0);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].skillName).toBe('TypeScript');
    expect(result.items[1].skillName).toBe('Node.js');
    expect(result.id).toBeTruthy();
  });
});
