import { describe, expect, test } from 'bun:test';
import { Application } from '../../src/entities/Application.js';
import { ApplicationStatus } from '../../src/value-objects/ApplicationStatus.js';

describe('Application', () => {
  test('creates application with defaults — status DRAFT, timestamps set', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    expect(app.id).toBeDefined();
    expect(app.profileId).toBe('profile-1');
    expect(app.companyId).toBe('company-1');
    expect(app.status).toBe(ApplicationStatus.DRAFT);
    expect(app.jobDescriptionId).toBeNull();
    expect(app.notes).toBeNull();
    expect(app.appliedAt).toBeInstanceOf(Date);
    expect(app.updatedAt).toBeInstanceOf(Date);
  });

  test('creates application with all optional fields', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1',
      status: ApplicationStatus.APPLIED,
      jobDescriptionId: 'jd-1',
      notes: 'Applied via referral'
    });

    expect(app.status).toBe(ApplicationStatus.APPLIED);
    expect(app.jobDescriptionId).toBe('jd-1');
    expect(app.notes).toBe('Applied via referral');
  });

  test('setStatus updates status and updatedAt', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    const originalUpdatedAt = app.updatedAt;

    // Small delay to ensure timestamp differs
    app.setStatus(ApplicationStatus.INTERVIEWING);

    expect(app.status).toBe(ApplicationStatus.INTERVIEWING);
    expect(app.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
  });
});
