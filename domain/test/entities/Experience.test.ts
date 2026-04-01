import { describe, expect, test } from 'bun:test';
import { Experience } from '../../src/entities/Experience.js';

describe('Experience', () => {
  const makeExperience = () =>
    Experience.create({
      profileId: 'profile-1',
      title: 'Staff Engineer',
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      location: 'New York, NY',
      startDate: '2022-01',
      endDate: 'Present',
      summary: 'Led platform team',
      ordinal: 0
    });

  test('creates with empty bullets', () => {
    const exp = makeExperience();
    expect(exp.title).toBe('Staff Engineer');
    expect(exp.companyName).toBe('Acme Corp');
    expect(exp.bullets).toEqual([]);
  });

  test('adds a bullet', () => {
    const exp = makeExperience();
    const bullet = exp.addBullet({ content: 'Built the thing', ordinal: 0 });
    expect(exp.bullets).toHaveLength(1);
    expect(bullet.content).toBe('Built the thing');
    expect(bullet.experienceId).toBe(exp.id.value);
  });

  test('removes a bullet and its variants', () => {
    const exp = makeExperience();
    const bullet = exp.addBullet({ content: 'Built the thing', ordinal: 0 });
    exp.removeBullet(bullet.id.value);
    expect(exp.bullets).toHaveLength(0);
  });

  test('finds bullet or fails', () => {
    const exp = makeExperience();
    const bullet = exp.addBullet({ content: 'Built the thing', ordinal: 0 });
    const found = exp.findBulletOrFail(bullet.id.value);
    expect(found.id.equals(bullet.id)).toBe(true);
  });

  test('throws when removing non-existent bullet', () => {
    const exp = makeExperience();
    expect(() => exp.removeBullet('nonexistent')).toThrow('Bullet not found');
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
});
