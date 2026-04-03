import { describe, expect, test } from 'bun:test';
import { ContentSelection, LlmProposal, ResumeProfile, type TailoredResume } from '@tailoredin/domain';
import type { ResumeChestQuery } from '../../../src/ports/ResumeChestQuery.js';
import type { ResumeProfileRepository } from '../../../src/ports/ResumeProfileRepository.js';
import type { ResumeTailoringService } from '../../../src/ports/ResumeTailoringService.js';
import type { TailoredResumeRepository } from '../../../src/ports/TailoredResumeRepository.js';
import { CreateTailoredResume } from '../../../src/use-cases/tailored-resume/CreateTailoredResume.js';

const NOW = new Date('2025-01-01');

function makeProfile(
  overrides: Partial<{ headlineText: string; contentSelection: ContentSelection }> = {}
): ResumeProfile {
  return new ResumeProfile({
    profileId: 'profile-1',
    headlineText: overrides.headlineText ?? 'Old Headline',
    contentSelection: overrides.contentSelection ?? ContentSelection.empty(),
    updatedAt: NOW
  });
}

function mockProfileRepo(profile: ResumeProfile | null): ResumeProfileRepository {
  return {
    findByProfileId: async () => profile,
    save: async () => {}
  };
}

function mockTailoredResumeRepo(onSave?: (r: TailoredResume) => void): TailoredResumeRepository {
  return {
    findById: async () => null,
    findByProfileId: async () => [],
    save: async (r: TailoredResume) => {
      onSave?.(r);
    }
  };
}

function mockChestQuery(): ResumeChestQuery {
  return {
    makeChestMarkdown: async () => '## Experience chest markdown'
  };
}

function mockTailoringService(proposal: LlmProposal): ResumeTailoringService {
  return {
    tailorFromJd: async () => proposal
  };
}

describe('CreateTailoredResume', () => {
  test('maps rankedBulletIds → bulletIds and rankedSkillIds → skillItemIds in content selection', async () => {
    const proposal = new LlmProposal({
      headlineOptions: ['New Headline', 'Alt Headline'],
      rankedExperiences: [
        { experienceId: 'exp-1', rankedBulletIds: ['b-3', 'b-1', 'b-2'] },
        { experienceId: 'exp-2', rankedBulletIds: ['b-5', 'b-4'] }
      ],
      generatedExperiences: [],
      rankedSkillIds: ['skill-z', 'skill-a'],
      assessment: 'Good fit'
    });

    let saved: TailoredResume | undefined;
    const useCase = new CreateTailoredResume(
      mockProfileRepo(makeProfile()),
      mockTailoredResumeRepo(r => {
        saved = r;
      }),
      mockTailoringService(proposal),
      mockChestQuery()
    );

    await useCase.execute({ profileId: 'profile-1', jdContent: 'Looking for an engineer' });

    expect(saved).toBeDefined();

    const cs = saved!.contentSelection;
    expect(cs.experienceSelections).toHaveLength(2);
    expect(cs.experienceSelections[0]!.experienceId).toBe('exp-1');
    expect(cs.experienceSelections[0]!.bulletIds).toEqual(['b-3', 'b-1', 'b-2']);
    expect(cs.experienceSelections[1]!.experienceId).toBe('exp-2');
    expect(cs.experienceSelections[1]!.bulletIds).toEqual(['b-5', 'b-4']);
    expect(cs.skillItemIds).toEqual(['skill-z', 'skill-a']);
  });

  test('sets headlineText to headlineOptions[0]', async () => {
    const proposal = new LlmProposal({
      headlineOptions: ['Senior TypeScript Engineer', 'Lead Developer'],
      rankedExperiences: [],
      generatedExperiences: [],
      rankedSkillIds: [],
      assessment: ''
    });

    let saved: TailoredResume | undefined;
    const useCase = new CreateTailoredResume(
      mockProfileRepo(makeProfile({ headlineText: 'Old Profile Headline' })),
      mockTailoredResumeRepo(r => {
        saved = r;
      }),
      mockTailoringService(proposal),
      mockChestQuery()
    );

    await useCase.execute({ profileId: 'profile-1', jdContent: 'JD text' });

    expect(saved!.headlineText).toBe('Senior TypeScript Engineer');
  });

  test('falls back to profile headlineText when headlineOptions is empty', async () => {
    const proposal = new LlmProposal({
      headlineOptions: [],
      rankedExperiences: [],
      generatedExperiences: [],
      rankedSkillIds: [],
      assessment: ''
    });

    let saved: TailoredResume | undefined;
    const useCase = new CreateTailoredResume(
      mockProfileRepo(makeProfile({ headlineText: 'Fallback Headline' })),
      mockTailoredResumeRepo(r => {
        saved = r;
      }),
      mockTailoringService(proposal),
      mockChestQuery()
    );

    await useCase.execute({ profileId: 'profile-1', jdContent: 'JD text' });

    expect(saved!.headlineText).toBe('Fallback Headline');
  });

  test('throws when profile is not found', async () => {
    const useCase = new CreateTailoredResume(
      mockProfileRepo(null),
      mockTailoredResumeRepo(),
      mockTailoringService(LlmProposal.empty()),
      mockChestQuery()
    );

    expect(useCase.execute({ profileId: 'missing', jdContent: 'JD' })).rejects.toThrow(
      'ResumeProfile not found: missing'
    );
  });
});
