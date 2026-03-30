import { describe, expect, test } from 'bun:test';
import { Archetype, type ArchetypeConfig, type ArchetypeConfigRepository } from '@tailoredin/domain';
import { CreateArchetype } from '../../src/use-cases/CreateArchetype.js';

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

describe('CreateArchetype', () => {
  test('creates archetype with empty collections and saves', async () => {
    let saved: ArchetypeConfig | null = null;
    const repo = createMockArchetypeRepository({
      save: async c => {
        saved = c;
      }
    });
    const uc = new CreateArchetype(repo);
    const result = await uc.execute({
      userId: 'user-1',
      archetypeKey: Archetype.LEAD_IC,
      archetypeLabel: 'Lead IC',
      archetypeDescription: 'For senior IC roles',
      headlineId: 'headline-1',
      socialNetworks: ['GitHub', 'LinkedIn']
    });

    expect(saved).not.toBeNull();
    expect(result.archetypeKey).toBe(Archetype.LEAD_IC);
    expect(result.archetypeLabel).toBe('Lead IC');
    expect(result.archetypeDescription).toBe('For senior IC roles');
    expect(result.headlineId).toBe('headline-1');
    expect(result.socialNetworks).toEqual(['GitHub', 'LinkedIn']);
    expect(result.positions).toEqual([]);
    expect(result.educationSelections).toEqual([]);
    expect(result.skillCategorySelections).toEqual([]);
    expect(result.skillItemSelections).toEqual([]);
    expect(result.id).toBeTruthy();
  });
});
