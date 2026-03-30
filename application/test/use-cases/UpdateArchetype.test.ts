import { describe, expect, test } from 'bun:test';
import { Archetype, ArchetypeConfig, type ArchetypeConfigRepository } from '@tailoredin/domain';
import { UpdateArchetype } from '../../src/use-cases/UpdateArchetype.js';

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

describe('UpdateArchetype', () => {
  test('returns error when not found', async () => {
    const repo = createMockArchetypeRepository();
    const uc = new UpdateArchetype(repo);
    const result = await uc.execute({ archetypeId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Archetype not found');
    }
  });

  test('updates metadata and saves', async () => {
    const config = makeArchetype();
    let saved = false;
    const repo = createMockArchetypeRepository({
      findByIdOrFail: async () => config,
      save: async () => {
        saved = true;
      }
    });
    const uc = new UpdateArchetype(repo);
    const result = await uc.execute({
      archetypeId: config.id.value,
      archetypeLabel: 'Updated Label',
      archetypeDescription: 'New description',
      socialNetworks: ['GitHub']
    });

    expect(result.isOk).toBe(true);
    expect(config.archetypeLabel).toBe('Updated Label');
    expect(config.archetypeDescription).toBe('New description');
    expect(config.socialNetworks).toEqual(['GitHub']);
    expect(saved).toBe(true);
  });
});
