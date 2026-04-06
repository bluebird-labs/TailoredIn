import { describe, expect, mock, test } from 'bun:test';
import { EntityNotFoundError, ResumeContent, ResumeContentId, type ResumeContentRepository } from '@tailoredin/domain';
import { UpdateResumeDisplaySettings } from '../../../src/use-cases/resume/UpdateResumeDisplaySettings.js';

function makeResumeContent() {
  return new ResumeContent({
    id: new ResumeContentId('rc-1'),
    profileId: 'profile-1',
    jobDescriptionId: 'jd-1',
    headline: 'Senior Engineer',
    experiences: [
      { experienceId: 'exp-1', summary: 'Built systems', bullets: ['A', 'B', 'C'], displayedBulletCount: null },
      { experienceId: 'exp-2', summary: 'Led teams', bullets: ['D', 'E'], displayedBulletCount: null }
    ],
    hiddenEducationIds: [],
    prompt: 'test',
    schema: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function mockRepo(resumeContent: ResumeContent | null): ResumeContentRepository {
  return {
    findLatestByJobDescriptionId: mock(async () => resumeContent),
    save: mock(async () => {}),
    update: mock(async () => {})
  };
}

describe('UpdateResumeDisplaySettings', () => {
  test('updates experience bullet counts', async () => {
    const repo = mockRepo(makeResumeContent());
    const useCase = new UpdateResumeDisplaySettings(repo);

    await useCase.execute({
      jobDescriptionId: 'jd-1',
      experienceBulletCounts: [{ experienceId: 'exp-1', displayedBulletCount: 2 }]
    });

    expect(repo.update).toHaveBeenCalledTimes(1);
    const saved = (repo.update as ReturnType<typeof mock>).mock.calls[0][0] as ResumeContent;
    expect(saved.experiences[0].displayedBulletCount).toBe(2);
    expect(saved.experiences[1].displayedBulletCount).toBeNull();
  });

  test('updates hidden education IDs', async () => {
    const repo = mockRepo(makeResumeContent());
    const useCase = new UpdateResumeDisplaySettings(repo);

    await useCase.execute({
      jobDescriptionId: 'jd-1',
      hiddenEducationIds: ['edu-1', 'edu-2']
    });

    expect(repo.update).toHaveBeenCalledTimes(1);
    const saved = (repo.update as ReturnType<typeof mock>).mock.calls[0][0] as ResumeContent;
    expect(saved.hiddenEducationIds).toEqual(['edu-1', 'edu-2']);
  });

  test('updates both at once', async () => {
    const repo = mockRepo(makeResumeContent());
    const useCase = new UpdateResumeDisplaySettings(repo);

    await useCase.execute({
      jobDescriptionId: 'jd-1',
      experienceBulletCounts: [{ experienceId: 'exp-2', displayedBulletCount: 1 }],
      hiddenEducationIds: ['edu-1']
    });

    const saved = (repo.update as ReturnType<typeof mock>).mock.calls[0][0] as ResumeContent;
    expect(saved.experiences[1].displayedBulletCount).toBe(1);
    expect(saved.hiddenEducationIds).toEqual(['edu-1']);
  });

  test('throws EntityNotFoundError when no resume content exists', async () => {
    const repo = mockRepo(null);
    const useCase = new UpdateResumeDisplaySettings(repo);

    await expect(
      useCase.execute({
        jobDescriptionId: 'jd-1',
        experienceBulletCounts: [{ experienceId: 'exp-1', displayedBulletCount: 2 }]
      })
    ).rejects.toThrow(EntityNotFoundError);
  });
});
