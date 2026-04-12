import { describe, expect, mock, test } from 'bun:test';
import {
  type JobDescriptionRepository,
  ResumeContent,
  type ResumeContentRepository,
  type ResumeScore
} from '@tailoredin/domain';
import type { ResumeScorer } from '../../../src/ports/ResumeScorer.js';
import { ResumeNotReadyError, ScoreResume } from '../../../src/use-cases/resume/ScoreResume.js';

function makeResumeContent(overrides?: { experiences?: ResumeContent['experiences'] }) {
  return new ResumeContent({
    id: 'rc-1',
    profileId: 'profile-1',
    jobDescriptionId: 'jd-1',
    headline: 'Senior Engineer',
    experiences: overrides?.experiences ?? [
      { experienceId: 'exp-1', summary: 'Built systems', bullets: ['Bullet A', 'Bullet B'], hiddenBulletIndices: [] },
      { experienceId: 'exp-2', summary: 'Led teams', bullets: ['Bullet C'], hiddenBulletIndices: [0] }
    ],
    hiddenEducationIds: [],
    prompt: 'test',
    schema: null,
    score: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

const fakeScore: ResumeScore = {
  overall: 72,
  requirements: [
    {
      requirement: 'TypeScript experience',
      coverage: 'strong',
      matchingBulletIndices: [0],
      reasoning: 'Bullet A demonstrates TypeScript expertise'
    }
  ],
  summary: 'Good coverage overall.'
};

describe('ScoreResume', () => {
  function setup(resumeContent: ResumeContent | null = makeResumeContent()) {
    const resumeContentRepo: ResumeContentRepository = {
      findById: mock(async () => resumeContent),
      findLatestByJobDescriptionId: mock(async () => null),
      save: mock(async () => {}),
      update: mock(async () => {})
    };

    const jdRepo: JobDescriptionRepository = {
      findById: mock(async () => ({ id: 'jd-1', description: 'We need a TypeScript engineer' }) as never),
      findAll: mock(async () => []),
      findByCompanyId: mock(async () => []),
      save: mock(async () => {}),
      delete: mock(async () => {})
    };

    const scorer: ResumeScorer = {
      score: mock(async () => fakeScore)
    };

    const useCase = new ScoreResume(resumeContentRepo, jdRepo, scorer);
    return { useCase, resumeContentRepo, jdRepo, scorer };
  }

  test('scores resume and persists result', async () => {
    const { useCase, resumeContentRepo, scorer } = setup();

    const result = await useCase.execute({ resumeContentId: 'rc-1' });

    expect(result.overall).toBe(72);
    expect(result.requirements).toHaveLength(1);
    expect(result.summary).toBe('Good coverage overall.');
    expect(scorer.score).toHaveBeenCalledTimes(1);
    expect(resumeContentRepo.update).toHaveBeenCalledTimes(1);

    const updated = (resumeContentRepo.update as ReturnType<typeof mock>).mock.calls[0][0] as ResumeContent;
    expect(updated.score).toEqual(fakeScore);
  });

  test('sends formatted markdown with only visible bullets', async () => {
    const { useCase, scorer } = setup();

    await useCase.execute({ resumeContentId: 'rc-1' });

    const call = (scorer.score as ReturnType<typeof mock>).mock.calls[0][0] as {
      resumeMarkdown: string;
    };
    // exp-2 has bullet at index 0 hidden, so "Bullet C" should not appear
    expect(call.resumeMarkdown).toContain('Bullet A');
    expect(call.resumeMarkdown).toContain('Bullet B');
    expect(call.resumeMarkdown).not.toContain('Bullet C');
  });

  test('throws EntityNotFoundError when resume not found', async () => {
    const { useCase } = setup(null);

    await expect(useCase.execute({ resumeContentId: 'missing' })).rejects.toThrow('ResumeContent');
  });

  test('throws ResumeNotReadyError when no bullets exist', async () => {
    const empty = makeResumeContent({
      experiences: [{ experienceId: 'exp-1', summary: '', bullets: [], hiddenBulletIndices: [] }]
    });
    const { useCase } = setup(empty);

    await expect(useCase.execute({ resumeContentId: 'rc-1' })).rejects.toBeInstanceOf(ResumeNotReadyError);
  });
});
