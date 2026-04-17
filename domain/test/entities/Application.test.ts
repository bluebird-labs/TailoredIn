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
    expect(app.resumeContentId).toBeNull();
    expect(app.archiveReason).toBeNull();
    expect(app.withdrawReason).toBeNull();
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

    app.setStatus(ApplicationStatus.INTERVIEWING);

    expect(app.status).toBe(ApplicationStatus.INTERVIEWING);
    expect(app.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
  });

  test('setStatus clears archive and withdraw reasons', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    app.archive('Role closed');
    expect(app.archiveReason).toBe('Role closed');

    app.setStatus(ApplicationStatus.DRAFT);
    expect(app.archiveReason).toBeNull();
    expect(app.withdrawReason).toBeNull();
  });

  test('setStatus throws when called with ARCHIVED', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    expect(() => app.setStatus(ApplicationStatus.ARCHIVED)).toThrow('Use archive() to set ARCHIVED status');
  });

  test('setStatus throws when called with WITHDRAWN', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    expect(() => app.setStatus(ApplicationStatus.WITHDRAWN)).toThrow('Use withdraw() to set WITHDRAWN status');
  });

  test('setStatus throws when called with APPLIED', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    expect(() => app.setStatus(ApplicationStatus.APPLIED)).toThrow('Use apply() to set APPLIED status');
  });

  test('apply sets status to APPLIED and stores resumeContentId', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    const beforeApply = app.updatedAt;
    app.apply('resume-content-1');

    expect(app.status).toBe(ApplicationStatus.APPLIED);
    expect(app.resumeContentId).toBe('resume-content-1');
    expect(app.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeApply.getTime());
  });

  test('apply throws when not in DRAFT status', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1',
      status: ApplicationStatus.SCREENING
    });

    expect(() => app.apply('resume-content-1')).toThrow('Can only apply from DRAFT status');
  });

  test('apply clears archive and withdraw reasons', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1',
      archiveReason: 'leftover',
      withdrawReason: 'leftover'
    });

    app.apply('resume-content-1');

    expect(app.archiveReason).toBeNull();
    expect(app.withdrawReason).toBeNull();
  });

  test('archive sets status, archiveReason, and clears withdrawReason', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    app.withdraw('Compensation mismatch');
    expect(app.withdrawReason).toBe('Compensation mismatch');

    const beforeArchive = app.updatedAt;
    app.archive('Position filled');

    expect(app.status).toBe(ApplicationStatus.ARCHIVED);
    expect(app.archiveReason).toBe('Position filled');
    expect(app.withdrawReason).toBeNull();
    expect(app.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeArchive.getTime());
  });

  test('withdraw sets status, withdrawReason, and clears archiveReason', () => {
    const app = Application.create({
      profileId: 'profile-1',
      companyId: 'company-1'
    });

    app.archive('Role closed');
    expect(app.archiveReason).toBe('Role closed');

    const beforeWithdraw = app.updatedAt;
    app.withdraw('Accepted another offer');

    expect(app.status).toBe(ApplicationStatus.WITHDRAWN);
    expect(app.withdrawReason).toBe('Accepted another offer');
    expect(app.archiveReason).toBeNull();
    expect(app.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeWithdraw.getTime());
  });
});
