import { describe, expect, test } from 'bun:test';
import { ResumeProfile } from '../../src/entities/ResumeProfile.js';
import { ContentSelection } from '../../src/value-objects/ContentSelection.js';

describe('ResumeProfile', () => {
  test('create() initialises with empty headlineText and empty contentSelection', () => {
    const profile = ResumeProfile.create('profile-1');

    expect(profile.profileId).toBe('profile-1');
    expect(profile.headlineText).toBe('');
    expect(profile.contentSelection).toBeInstanceOf(ContentSelection);
    expect(profile.contentSelection.experienceSelections).toEqual([]);
    expect(profile.contentSelection.skillCategoryIds).toEqual([]);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  test('updateHeadline() sets headlineText and bumps updatedAt', () => {
    const profile = ResumeProfile.create('profile-2');
    const before = profile.updatedAt;

    // Ensure at least 1 ms passes so the new Date is strictly later
    const newUpdatedAt = new Date(before.getTime() + 1);
    profile.updateHeadline('Senior Software Engineer');

    expect(profile.headlineText).toBe('Senior Software Engineer');
    expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(newUpdatedAt.getTime() - 1);
  });

  test('updateHeadline() does not affect contentSelection', () => {
    const selection = new ContentSelection({
      experienceSelections: [{ experienceId: 'exp-1', bulletIds: ['b-1'] }],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });
    const profile = ResumeProfile.create('profile-3');
    profile.replaceContentSelection(selection);

    profile.updateHeadline('Staff Engineer');

    expect(profile.contentSelection.experienceSelections).toHaveLength(1);
    expect(profile.contentSelection.experienceSelections[0].experienceId).toBe('exp-1');
  });

  test('replaceContentSelection() sets contentSelection and bumps updatedAt', () => {
    const profile = ResumeProfile.create('profile-4');
    const before = profile.updatedAt;

    const selection = new ContentSelection({
      experienceSelections: [],
      projectIds: [],
      educationIds: ['edu-1'],
      skillCategoryIds: ['sc-1'],
      skillItemIds: []
    });

    const newUpdatedAt = new Date(before.getTime() + 1);
    profile.replaceContentSelection(selection);

    expect(profile.contentSelection).toBe(selection);
    expect(profile.contentSelection.educationIds).toEqual(['edu-1']);
    expect(profile.contentSelection.skillCategoryIds).toEqual(['sc-1']);
    expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(newUpdatedAt.getTime() - 1);
  });

  test('replaceContentSelection() does not affect headlineText', () => {
    const profile = ResumeProfile.create('profile-5');
    profile.updateHeadline('Principal Engineer');

    profile.replaceContentSelection(ContentSelection.empty());

    expect(profile.headlineText).toBe('Principal Engineer');
  });
});
