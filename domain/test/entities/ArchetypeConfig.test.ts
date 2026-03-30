import { describe, expect, test } from 'bun:test';
import { ArchetypeConfig } from '../../src/entities/ArchetypeConfig.js';
import { ArchetypePosition } from '../../src/entities/ArchetypePosition.js';
import { Archetype } from '../../src/value-objects/Archetype.js';
import { ArchetypeConfigId } from '../../src/value-objects/ArchetypeConfigId.js';
import { ArchetypePositionBulletRef } from '../../src/value-objects/ArchetypePositionBulletRef.js';
import {
  ArchetypeEducationSelection,
  ArchetypeSkillCategorySelection,
  ArchetypeSkillItemSelection
} from '../../src/value-objects/ArchetypeSelections.js';

describe('ArchetypeConfig', () => {
  const makeProps = () => {
    const bulletRef = new ArchetypePositionBulletRef('bullet-1', 0);
    const position = ArchetypePosition.create({
      archetypeId: 'temp',
      resumeCompanyId: 'company-1',
      jobTitle: 'Staff Software Engineer',
      displayCompanyName: 'Acme Corp',
      locationLabel: 'New York, NY',
      startDate: '2023-01',
      endDate: '2024-06',
      roleSummary: 'Led platform team',
      ordinal: 0,
      bullets: [bulletRef]
    });

    return {
      userId: 'user-1',
      archetypeKey: Archetype.LEAD_IC,
      archetypeLabel: 'Lead IC',
      archetypeDescription: 'For senior IC roles',
      headlineId: 'headline-1',
      socialNetworks: ['GitHub', 'LinkedIn'],
      positions: [position],
      educationSelections: [new ArchetypeEducationSelection('edu-1', 0)],
      skillCategorySelections: [new ArchetypeSkillCategorySelection('cat-1', 0)],
      skillItemSelections: [new ArchetypeSkillItemSelection('item-1', 0)]
    };
  };

  test('create generates id, sets timestamps, includes all children', () => {
    const config = ArchetypeConfig.create(makeProps());

    expect(config.id).toBeInstanceOf(ArchetypeConfigId);
    expect(config.userId).toBe('user-1');
    expect(config.archetypeKey).toBe(Archetype.LEAD_IC);
    expect(config.archetypeLabel).toBe('Lead IC');
    expect(config.archetypeDescription).toBe('For senior IC roles');
    expect(config.headlineId).toBe('headline-1');
    expect(config.socialNetworks).toEqual(['GitHub', 'LinkedIn']);
    expect(config.positions).toHaveLength(1);
    expect(config.positions[0].jobTitle).toBe('Staff Software Engineer');
    expect(config.positions[0].bullets).toHaveLength(1);
    expect(config.positions[0].bullets[0].bulletId).toBe('bullet-1');
    expect(config.educationSelections).toHaveLength(1);
    expect(config.educationSelections[0].educationId).toBe('edu-1');
    expect(config.skillCategorySelections).toHaveLength(1);
    expect(config.skillItemSelections).toHaveLength(1);
    expect(config.createdAt).toBeInstanceOf(Date);
  });

  test('create handles nullable description', () => {
    const config = ArchetypeConfig.create({ ...makeProps(), archetypeDescription: null });
    expect(config.archetypeDescription).toBeNull();
  });

  test('is an aggregate root with domain events', () => {
    const config = ArchetypeConfig.create(makeProps());
    expect(config.domainEvents).toEqual([]);
    expect(typeof config.clearDomainEvents).toBe('function');
  });
});

describe('ArchetypePosition', () => {
  test('create generates id and timestamps', () => {
    const bulletRef = new ArchetypePositionBulletRef('bullet-1', 0);
    const position = ArchetypePosition.create({
      archetypeId: 'arch-1',
      resumeCompanyId: 'company-1',
      jobTitle: 'Senior Software Engineer',
      displayCompanyName: 'Volvo Cars',
      locationLabel: 'Stockholm, Sweden',
      startDate: '2018-01',
      endDate: '2020-03',
      roleSummary: 'Backend and DevOps focus',
      ordinal: 3,
      bullets: [bulletRef]
    });

    expect(position.archetypeId).toBe('arch-1');
    expect(position.resumeCompanyId).toBe('company-1');
    expect(position.jobTitle).toBe('Senior Software Engineer');
    expect(position.displayCompanyName).toBe('Volvo Cars');
    expect(position.locationLabel).toBe('Stockholm, Sweden');
    expect(position.startDate).toBe('2018-01');
    expect(position.endDate).toBe('2020-03');
    expect(position.roleSummary).toBe('Backend and DevOps focus');
    expect(position.ordinal).toBe(3);
    expect(position.bullets).toHaveLength(1);
    expect(position.createdAt).toBeInstanceOf(Date);
  });
});
