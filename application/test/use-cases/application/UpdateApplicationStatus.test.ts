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
      applicationId: app.id.value,
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
});
