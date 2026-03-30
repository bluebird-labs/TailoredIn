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

describe('ArchetypeConfig', () => {
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

describe('ArchetypeConfig.replacePositions', () => {
  test('replaces all positions with new ones', () => {
    const config = ArchetypeConfig.create(makeProps());
    expect(config.positions).toHaveLength(1);

    const newPos = ArchetypePosition.create({
      archetypeId: config.id.value,
      resumeCompanyId: 'company-2',
      jobTitle: 'CTO',
      displayCompanyName: 'NewCo',
      locationLabel: 'Remote',
      startDate: '2024-01',
      endDate: '2025-01',
      roleSummary: 'Led engineering',
      ordinal: 0,
      bullets: []
    });
    config.replacePositions([newPos]);
    expect(config.positions).toHaveLength(1);
    expect(config.positions[0].jobTitle).toBe('CTO');
  });

  test('updates updatedAt', () => {
    const config = ArchetypeConfig.create(makeProps());
    const before = config.updatedAt;
    config.replacePositions([]);
    expect(config.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('works with empty array', () => {
    const config = ArchetypeConfig.create(makeProps());
    config.replacePositions([]);
    expect(config.positions).toHaveLength(0);
  });
});

describe('ArchetypeConfig.replaceEducationSelections', () => {
  test('replaces all education selections', () => {
    const config = ArchetypeConfig.create(makeProps());
    expect(config.educationSelections).toHaveLength(1);
    config.replaceEducationSelections([
      new ArchetypeEducationSelection('edu-2', 0),
      new ArchetypeEducationSelection('edu-3', 1)
    ]);
    expect(config.educationSelections).toHaveLength(2);
    expect(config.educationSelections[0].educationId).toBe('edu-2');
  });

  test('updates updatedAt', () => {
    const config = ArchetypeConfig.create(makeProps());
    const before = config.updatedAt;
    config.replaceEducationSelections([]);
    expect(config.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('ArchetypeConfig.replaceSkillSelections', () => {
  test('replaces both category and item selections', () => {
    const config = ArchetypeConfig.create(makeProps());
    expect(config.skillCategorySelections).toHaveLength(1);
    expect(config.skillItemSelections).toHaveLength(1);

    config.replaceSkillSelections(
      [new ArchetypeSkillCategorySelection('cat-2', 0), new ArchetypeSkillCategorySelection('cat-3', 1)],
      [new ArchetypeSkillItemSelection('item-2', 0)]
    );

    expect(config.skillCategorySelections).toHaveLength(2);
    expect(config.skillCategorySelections[0].categoryId).toBe('cat-2');
    expect(config.skillItemSelections).toHaveLength(1);
    expect(config.skillItemSelections[0].itemId).toBe('item-2');
  });

  test('updates updatedAt', () => {
    const config = ArchetypeConfig.create(makeProps());
    const before = config.updatedAt;
    config.replaceSkillSelections([], []);
    expect(config.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
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
