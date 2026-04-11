import { describe, expect, test } from 'bun:test';
import { Application, type ApplicationRepository, ApplicationStatus } from '@tailoredin/domain';
import { UpdateApplicationStatus } from '../../../src/use-cases/application/UpdateApplicationStatus.js';

function makeApplication(): Application {
  return Application.create({
    profileId: 'profile-1',
    companyId: 'company-1'
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

describe('UpdateApplicationStatus', () => {
  test('updates status and returns updated DTO', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app));

    const dto = await useCase.execute({
      applicationId: app.id,
      status: ApplicationStatus.INTERVIEWING
    });

    expect(dto.status).toBe('interviewing');
  });

  test('throws when application not found', async () => {
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(null));

    await expect(
      useCase.execute({
        applicationId: 'non-existent-id',
        status: ApplicationStatus.APPLIED
      })
    ).rejects.toThrow('Application not found');
  });

  test('archives with reason and returns updated DTO', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app));

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
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app));

    await expect(
      useCase.execute({
        applicationId: app.id,
        status: ApplicationStatus.ARCHIVED
      })
    ).rejects.toThrow('Archive reason is required');
  });

  test('withdraws with reason and returns updated DTO', async () => {
    const app = makeApplication();
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app));

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
    const useCase = new UpdateApplicationStatus(mockApplicationRepo(app));

    await expect(
      useCase.execute({
        applicationId: app.id,
        status: ApplicationStatus.WITHDRAWN
      })
    ).rejects.toThrow('Withdraw reason is required');
  });
});
