import { describe, expect, test } from 'bun:test';
import { Archetype, ArchetypeConfig, type ArchetypeConfigRepository } from '@tailoredin/domain';
import { DeleteArchetype } from '../../src/use-cases/DeleteArchetype.js';

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

describe('DeleteArchetype', () => {
  test('returns error when not found', async () => {
    const repo = createMockArchetypeRepository();
    const uc = new DeleteArchetype(repo);
    const result = await uc.execute({ archetypeId: 'nonexistent' });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Archetype not found');
    }
  });

  test('deletes', async () => {
    const config = ArchetypeConfig.create({
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
    let deletedId: string | null = null;
    const repo = createMockArchetypeRepository({
      findByIdOrFail: async () => config,
      delete: async id => {
        deletedId = id;
      }
    });
    const uc = new DeleteArchetype(repo);
    const result = await uc.execute({ archetypeId: config.id.value });
    expect(result.isOk).toBe(true);
    expect(deletedId).toBe(config.id.value);
  });
});
