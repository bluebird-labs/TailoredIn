import { describe, expect, test } from 'bun:test';
import { ContentSelection, type ResumeProfile } from '@tailoredin/domain';
import type { ResumeProfileRepository } from '../../../src/ports/ResumeProfileRepository.js';
import { UpdateResumeProfile } from '../../../src/use-cases/resume-profile/UpdateResumeProfile.js';

function mockRepo(existing: ResumeProfile | null, onSave?: (p: ResumeProfile) => void): ResumeProfileRepository {
  return {
    findByProfileId: async () => existing,
    save: async (p: ResumeProfile) => {
      onSave?.(p);
    }
  };
}

const baseSelection = {
  experienceSelections: [],
  projectIds: [],
  educationIds: ['edu-1'],
  skillCategoryIds: ['cat-1'],
  skillItemIds: ['skill-1']
};

describe('UpdateResumeProfile', () => {
  test('creates a new profile when none exists', async () => {
    let saved: ResumeProfile | undefined;
    const useCase = new UpdateResumeProfile(
      mockRepo(null, p => {
        saved = p;
      })
    );

    await useCase.execute({
      profileId: 'profile-123',
      contentSelection: baseSelection,
      headlineText: 'Senior Engineer'
    });

    expect(saved).toBeDefined();
    expect(saved!.profileId).toBe('profile-123');
    expect(saved!.headlineText).toBe('Senior Engineer');
    expect(saved!.contentSelection.educationIds).toEqual(['edu-1']);
    expect(saved!.contentSelection.skillItemIds).toEqual(['skill-1']);
  });

  test('updates an existing profile without creating a new one', async () => {
    const existing = {
      profileId: 'profile-123',
      headlineText: 'Old Headline',
      contentSelection: ContentSelection.empty(),
      updatedAt: new Date('2025-01-01')
    };

    // Use the real ResumeProfile domain object
    const { ResumeProfile } = await import('@tailoredin/domain');
    const existingProfile = new ResumeProfile(existing);

    let saved: ResumeProfile | undefined;
    const useCase = new UpdateResumeProfile(
      mockRepo(existingProfile, p => {
        saved = p;
      })
    );

    await useCase.execute({
      profileId: 'profile-123',
      contentSelection: baseSelection,
      headlineText: 'Updated Headline'
    });

    expect(saved).toBeDefined();
    expect(saved!.profileId).toBe('profile-123');
    expect(saved!.headlineText).toBe('Updated Headline');
    expect(saved!.contentSelection.skillCategoryIds).toEqual(['cat-1']);
    // confirm it's the same object (not a newly created one)
    expect(saved).toBe(existingProfile);
  });
});
