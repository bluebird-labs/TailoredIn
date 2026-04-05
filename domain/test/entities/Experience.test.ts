import { describe, expect, test } from 'bun:test';
import { Experience } from '../../src/entities/Experience.js';

describe('Experience', () => {
  const makeExperience = () =>
    Experience.create({
      profileId: 'profile-1',
      title: 'Staff Engineer',
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      companyId: null,
      location: 'New York, NY',
      startDate: '2022-01',
      endDate: 'Present',
      summary: 'Led platform team',
      ordinal: 0
    });

  test('creates with empty accomplishments', () => {
    const exp = makeExperience();
    expect(exp.title).toBe('Staff Engineer');
    expect(exp.companyName).toBe('Acme Corp');
    expect(exp.accomplishments).toEqual([]);
  });

  test('adds an accomplishment', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', skillTags: [], ordinal: 0 });
    expect(exp.accomplishments).toHaveLength(1);
    expect(accomplishment.title).toBe('T');
    expect(accomplishment.experienceId).toBe(exp.id.value);
  });

  test('removes an accomplishment', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', skillTags: [], ordinal: 0 });
    exp.removeAccomplishment(accomplishment.id.value);
    expect(exp.accomplishments).toHaveLength(0);
  });

  test('finds accomplishment or fails', () => {
    const exp = makeExperience();
    const accomplishment = exp.addAccomplishment({ title: 'T', narrative: 'N', skillTags: [], ordinal: 0 });
    const found = exp.findAccomplishmentOrFail(accomplishment.id.value);
    expect(found.id.equals(accomplishment.id)).toBe(true);
  });

  test('throws when removing non-existent accomplishment', () => {
    const exp = makeExperience();
    expect(() => exp.removeAccomplishment('nonexistent')).toThrow('Accomplishment not found');
  });

  test('updates mutable fields', () => {
    const exp = makeExperience();
    exp.title = 'Principal Engineer';
    exp.companyName = 'NewCo';
    exp.location = 'Remote';
    expect(exp.title).toBe('Principal Engineer');
    expect(exp.companyName).toBe('NewCo');
    expect(exp.location).toBe('Remote');
  });

  test('starts with null companyId', () => {
    const exp = makeExperience();
    expect(exp.companyId).toBeNull();
  });

  test('links a company', () => {
    const exp = makeExperience();
    const before = exp.updatedAt;
    exp.linkCompany('company-123');
    expect(exp.companyId).toBe('company-123');
    expect(exp.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  test('unlinks a company', () => {
    const exp = makeExperience();
    exp.linkCompany('company-123');
    exp.unlinkCompany();
    expect(exp.companyId).toBeNull();
  });
});
