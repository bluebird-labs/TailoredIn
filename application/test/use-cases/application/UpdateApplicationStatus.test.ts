import { describe, expect, test } from 'bun:test';
import {
  Application,
  type ApplicationRepository,
  ApplicationStatus,
  ResumeContent,
  type ResumeContentRepository
} from '@tailoredin/domain';
import { UpdateApplicationStatus } from '../../../src/use-cases/application/UpdateApplicationStatus.js';

function makeApplication(): Application {
  return Application.create({
    profileId: 'profile-1',
    companyId: 'company-1'
  });
}

function makeResumeContent(): ResumeContent {
  return ResumeContent.create({
    profileId: 'profile-1',
    jobDescriptionId: 'jd-1',
    headline: 'Test headline',
    experiences: [],
    prompt: '{}',
    schema: null
  });
}

function mockApplicationRepo(existing: Application | null): ApplicationRepository {
  return {
    findById: async () => existing,
    findByProfileId: async () => [],
    save: async () => {},
    delete: async () => {}
  };
}

function mockResumeContentRepo(existing: ResumeContent | null): ResumeContentRepository {
  return {
    findById: async () => existing,
    findLatestByJobDescriptionId: async () => existing,
    save: async () => {},
    update: async () => {}
  };
}

describe('UpdateApplicationStatus', () => {
  test('updates status and returns updated DTO', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(null));

    const dto = await useCase.execute({
      applicationId: app.id,
      status: ApplicationStatus.SCREENING
    });

    expect(dto.status).toBe('screening');
  });

  test('throws when application not found', async () => {
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(null), mockResumeContentRepo(null));

    await expect(
      useCase.execute({
        applicationId: 'non-existent-id',
        status: ApplicationStatus.SCREENING
      })
    ).rejects.toThrow('Application not found');
  });

  test('applies with valid resumeContentId', async () => {
    const app = makeApplication();
    const resume = makeResumeContent();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(resume));

    const dto = await useCase.execute({
      applicationId: app.id,
      status: ApplicationStatus.APPLIED,
      resumeContentId: resume.id
    });

    expect(dto.status).toBe('applied');
    expect(dto.resumeContentId).toBe(resume.id);
  });

  test('throws when applying without resumeContentId', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(null));

    await expect(
      useCase.execute({
        applicationId: app.id,
        status: ApplicationStatus.APPLIED
      })
    ).rejects.toThrow('Resume content ID is required when applying');
  });

  test('throws when applying with non-existent resumeContentId', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(null));

    await expect(
      useCase.execute({
        applicationId: app.id,
        status: ApplicationStatus.APPLIED,
        resumeContentId: 'non-existent-id'
      })
    ).rejects.toThrow('Resume content not found: non-existent-id');
  });

  test('archives with reason and returns updated DTO', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(null));

    const dto = await useCase.execute({
      applicationId: app.id,
      status: ApplicationStatus.ARCHIVED,
      archiveReason: 'Role closed'
    });

    expect(dto.status).toBe('archived');
    expect(dto.archiveReason).toBe('Role closed');
    expect(dto.withdrawReason).toBeNull();
  });

  test('throws when archiving without reason', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(null));

    await expect(
      useCase.execute({
        applicationId: app.id,
        status: ApplicationStatus.ARCHIVED
      })
    ).rejects.toThrow('Archive reason is required');
  });

  test('withdraws with reason and returns updated DTO', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(null));

    const dto = await useCase.execute({
      applicationId: app.id,
      status: ApplicationStatus.WITHDRAWN,
      withdrawReason: 'Accepted another offer'
    });

    expect(dto.status).toBe('withdrawn');
    expect(dto.withdrawReason).toBe('Accepted another offer');
    expect(dto.archiveReason).toBeNull();
  });

  test('throws when withdrawing without reason', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app), mockResumeContentRepo(null));

    await expect(
      useCase.execute({
        applicationId: app.id,
        status: ApplicationStatus.WITHDRAWN
      })
    ).rejects.toThrow('Withdraw reason is required');
  });
});
