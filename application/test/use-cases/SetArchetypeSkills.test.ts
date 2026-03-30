import { describe, expect, test } from 'bun:test';
import { Archetype, ArchetypeConfig, type ArchetypeConfigRepository } from '@tailoredin/domain';
import { SetArchetypeSkills } from '../../src/use-cases/SetArchetypeSkills.js';

function createMockArchetypeRepository(overrides: Partial<ArchetypeConfigRepository> = {}): ArchetypeConfigRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findByUserAndKey: async () => null,
    findAllByUserId: async () => [],
    save: async () => {},
    delete: async () => {},
    ...overrides
  };
}

function makeArchetype() {
  return ArchetypeConfig.create({
    userId: 'user-1',
    archetypeKey: Archetype.LEAD_IC,
    archetypeLabel: 'Lead IC',
    archetypeDescription: null,
    headlineId: 'headline-1',
    socialNetworks: [],
    positions: [],
    educationSelections: [],
    skillCategorySelections: [],
    skillItemSelections: []
  });
}

describe('SetArchetypeSkills', () => {
  test('returns error when not found', async () => {
    const repo = createMockArchetypeRepository();
    const uc = new SetArchetypeSkills(repo);
    const result = await uc.execute({
      archetypeId: 'nonexistent',
      categorySelections: [],
      itemSelections: []
    });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Archetype not found');
    }
  });

  test('replaces skill selections and saves', async () => {
    const config = makeArchetype();
    let saved = false;
    const repo = createMockArchetypeRepository({
      findByIdOrFail: async () => config,
      save: async () => {
        saved = true;
      }
    });
    const uc = new SetArchetypeSkills(repo);
    const result = await uc.execute({
      archetypeId: config.id.value,
      categorySelections: [
        { categoryId: 'cat-1', ordinal: 0 },
        { categoryId: 'cat-2', ordinal: 1 }
      ],
      itemSelections: [{ itemId: 'item-1', ordinal: 0 }]
    });

    expect(result.isOk).toBe(true);
    expect(config.skillCategorySelections).toHaveLength(2);
    expect(config.skillCategorySelections[0].categoryId).toBe('cat-1');
    expect(config.skillItemSelections).toHaveLength(1);
    expect(config.skillItemSelections[0].itemId).toBe('item-1');
    expect(saved).toBe(true);
  });
});
