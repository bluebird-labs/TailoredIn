import { describe, expect, test } from 'bun:test';
import {
  Archetype,
  ArchetypeConfig,
  type ArchetypeConfigRepository,
  ArchetypeEducationSelection,
  ArchetypePosition,
  ArchetypePositionBulletRef,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection
} from '@tailoredin/domain';
import { ListArchetypes } from '../../src/use-cases/ListArchetypes.js';

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

describe('ListArchetypes', () => {
  test('returns mapped DTOs', async () => {
    const config = ArchetypeConfig.create({
      userId: 'user-1',
      archetypeKey: Archetype.LEAD_IC,
      archetypeLabel: 'Lead IC',
      archetypeDescription: 'For senior IC roles',
      headlineId: 'headline-1',
      socialNetworks: ['GitHub'],
      positions: [
        ArchetypePosition.create({
          archetypeId: 'temp',
          resumeCompanyId: 'company-1',
          jobTitle: 'Staff Engineer',
          displayCompanyName: 'Acme',
          locationLabel: 'NYC',
          startDate: '2020-01',
          endDate: '2023-01',
          roleSummary: 'Led platform',
          ordinal: 0,
          bullets: [new ArchetypePositionBulletRef('bullet-1', 0)]
        })
      ],
      educationSelections: [new ArchetypeEducationSelection('edu-1', 0)],
      skillCategorySelections: [new ArchetypeSkillCategorySelection('cat-1', 0)],
      skillItemSelections: [new ArchetypeSkillItemSelection('item-1', 0)]
    });

    const repo = createMockArchetypeRepository({
      findAllByUserId: async () => [config]
    });
    const uc = new ListArchetypes(repo);
    const result = await uc.execute({ userId: 'user-1' });

    expect(result).toHaveLength(1);
    expect(result[0].archetypeLabel).toBe('Lead IC');
    expect(result[0].positions).toHaveLength(1);
    expect(result[0].positions[0].jobTitle).toBe('Staff Engineer');
    expect(result[0].positions[0].bullets).toHaveLength(1);
    expect(result[0].educationSelections).toHaveLength(1);
    expect(result[0].skillCategorySelections).toHaveLength(1);
    expect(result[0].skillItemSelections).toHaveLength(1);
    expect(result[0].id).toBe(config.id.value);
  });
});
