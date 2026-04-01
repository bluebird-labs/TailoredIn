import { describe, expect, test } from 'bun:test';
import { Archetype2 } from '../../src/entities/Archetype2.js';
import { ContentSelection } from '../../src/value-objects/ContentSelection.js';
import { TagProfile } from '../../src/value-objects/TagProfile.js';

describe('Archetype2', () => {
  test('create() generates id and defaults tagProfile + contentSelection to empty', () => {
    const archetype = Archetype2.create({ profileId: 'profile-1', key: 'fullstack-lead', label: 'Full-Stack Lead' });
    expect(archetype.id.value).toMatch(/^[0-9a-f-]{36}$/);
    expect(archetype.profileId).toBe('profile-1');
    expect(archetype.key).toBe('fullstack-lead');
    expect(archetype.label).toBe('Full-Stack Lead');
    expect(archetype.headlineId).toBeNull();
    expect(archetype.tagProfile.roleWeights.size).toBe(0);
    expect(archetype.tagProfile.skillWeights.size).toBe(0);
    expect(archetype.contentSelection.experienceSelections).toHaveLength(0);
    expect(archetype.createdAt).toBeInstanceOf(Date);
    expect(archetype.updatedAt).toBeInstanceOf(Date);
  });

  test('updateMetadata() updates key, label, headlineId and bumps updatedAt', () => {
    const archetype = Archetype2.create({ profileId: 'p-1', key: 'old', label: 'Old' });
    const before = archetype.updatedAt;
    archetype.updateMetadata('new-key', 'New Label', 'headline-1');
    expect(archetype.key).toBe('new-key');
    expect(archetype.label).toBe('New Label');
    expect(archetype.headlineId).toBe('headline-1');
    expect(archetype.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('replaceTagProfile() replaces profile and bumps updatedAt', () => {
    const archetype = Archetype2.create({ profileId: 'p-1', key: 'k', label: 'L' });
    const profile = new TagProfile({
      roleWeights: new Map([['leadership', 0.8]]),
      skillWeights: new Map([['typescript', 1.0]])
    });
    archetype.replaceTagProfile(profile);
    expect(archetype.tagProfile.roleWeights.get('leadership')).toBe(0.8);
    expect(archetype.tagProfile.skillWeights.get('typescript')).toBe(1.0);
  });

  test('replaceContentSelection() replaces selection and bumps updatedAt', () => {
    const archetype = Archetype2.create({ profileId: 'p-1', key: 'k', label: 'L' });
    const selection = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletVariantIds: ['v-1', 'v-2'] }],
      projectIds: [],
      educationIds: ['edu-1'],
      skillCategoryIds: ['cat-1'],
      skillItemIds: ['item-1']
    });
    archetype.replaceContentSelection(selection);
    expect(archetype.contentSelection.experienceSelections).toHaveLength(1);
    expect(archetype.contentSelection.educationIds).toEqual(['edu-1']);
  });
});
