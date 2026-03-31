import { describe, expect, test } from 'bun:test';
import { Archetype, ArchetypeConfig, type ArchetypeConfigRepository } from '@tailoredin/domain';
import { SetArchetypePositions } from '../../src/use-cases/SetArchetypePositions.js';

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

describe('SetArchetypePositions', () => {
  test('returns error when not found', async () => {
    const repo = createMockArchetypeRepository();
    const uc = new SetArchetypePositions(repo);
    const result = await uc.execute({ archetypeId: 'nonexistent', positions: [] });
    expect(result.isOk).toBe(false);
    if (result.isErr) {
      expect(result.error.message).toContain('Archetype not found');
    }
  });

  test('replaces positions and saves', async () => {
    const config = makeArchetype();
    let saved = false;
    const repo = createMockArchetypeRepository({
      findByIdOrFail: async () => config,
      save: async () => {
        saved = true;
      }
    });
    const uc = new SetArchetypePositions(repo);
    const result = await uc.execute({
      archetypeId: config.id.value,
      positions: [
        {
          resumePositionId: 'position-1',
          jobTitle: 'Staff Engineer',
          displayCompanyName: 'Acme',
          locationLabel: 'NYC',
          startDate: '2020-01',
          endDate: '2023-01',
          roleSummary: 'Led platform',
          ordinal: 0,
          bullets: [{ bulletId: 'bullet-1', ordinal: 0 }]
        }
      ]
    });

    expect(result.isOk).toBe(true);
    expect(config.positions).toHaveLength(1);
    expect(config.positions[0].jobTitle).toBe('Staff Engineer');
    expect(config.positions[0].bullets).toHaveLength(1);
    expect(saved).toBe(true);
  });
});
