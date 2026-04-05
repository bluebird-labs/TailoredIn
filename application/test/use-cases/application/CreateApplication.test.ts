import { describe, expect, test } from 'bun:test';
import type { Application, ApplicationRepository } from '@tailoredin/domain';
import { CreateApplication } from '../../../src/use-cases/application/CreateApplication.js';

function mockApplicationRepo(onSave?: (a: Application) => void): ApplicationRepository {
  return {
    findById: async () => null,
    findByProfileId: async () => [],
    save: async (a: Application) => {
      onSave?.(a);
    },
    delete: async () => {}
  };
}

describe('CreateApplication', () => {
  test('creates application and returns DTO with generated id', async () => {
    let saved: Application | undefined;

    const useCase = new CreateApplication(
      mockApplicationRepo(a => {
        saved = a;
      })
    );

    const dto = await useCase.execute({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    expect(dto.id).toBeString();
    expect(dto.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(dto.profileId).toBe('profile-1');
    expect(dto.companyId).toBe('company-1');
    expect(dto.status).toBe('draft');
    expect(dto.jobDescriptionId).toBeNull();
    expect(dto.notes).toBeNull();
    expect(dto.appliedAt).toBeString();
    expect(dto.updatedAt).toBeString();
    expect(saved).toBeDefined();
  });

  test('creates application with optional fields', async () => {
    const useCase = new CreateApplication(mockApplicationRepo());

    const dto = await useCase.execute({
      profileId: 'profile-1',
      companyId: 'company-1',
      jobDescriptionId: 'jd-1',
      notes: 'Via referral'
    });

    expect(dto.jobDescriptionId).toBe('jd-1');
    expect(dto.notes).toBe('Via referral');
  });
});
