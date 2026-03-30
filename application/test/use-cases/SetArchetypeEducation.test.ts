import { describe, expect, test } from 'bun:test';
import { Archetype, ArchetypeConfig, type ArchetypeConfigRepository } from '@tailoredin/domain';
import { SetArchetypeEducation } from '../../src/use-cases/SetArchetypeEducation.js';

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

describe('SetArchetypeEducation', () => {
  test('returns error when not found', async () => {
    const repo = createMockArchetypeRepository();
    const uc = new SetArchetypeEducation(repo);
    const result = await uc.execute({ archetypeId: 'nonexistent', selections: [] });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Archetype not found');
    }
  });

  test('replaces education selections and saves', async () => {
    const config = makeArchetype();
    let saved = false;
    const repo = createMockArchetypeRepository({
      findByIdOrFail: async () => config,
      save: async () => {
        saved = true;
      }
    });
    const uc = new SetArchetypeEducation(repo);
    const result = await uc.execute({
      archetypeId: config.id.value,
      selections: [
        { educationId: 'edu-1', ordinal: 0 },
        { educationId: 'edu-2', ordinal: 1 }
      ]
    });

    expect(result.isOk).toBe(true);
    expect(config.educationSelections).toHaveLength(2);
    expect(config.educationSelections[0].educationId).toBe('edu-1');
    expect(config.educationSelections[1].educationId).toBe('edu-2');
    expect(saved).toBe(true);
  });
});
