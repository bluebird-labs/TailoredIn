import { describe, expect, test } from 'bun:test';
import { Profile } from '../../src/entities/Profile.js';

describe('Profile', () => {
  const makeProfile = (overrides?: Partial<Parameters<typeof Profile.create>[0]>) =>
    Profile.create({
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      about: null,
      phone: null,
      location: null,
      linkedinUrl: null,
      githubUrl: null,
      websiteUrl: null,
      ...overrides
    });

  test('creates with generated id and timestamps', () => {
    const profile = makeProfile();
    expect(profile.id).toBeDefined();
    expect(profile.email).toBe('john@example.com');
    expect(profile.firstName).toBe('John');
    expect(profile.lastName).toBe('Doe');
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  test('fullName concatenates first and last name', () => {
    const profile = makeProfile({ firstName: 'Jane', lastName: 'Smith' });
    expect(profile.fullName).toBe('Jane Smith');
  });

  test('preserves optional fields', () => {
    const profile = makeProfile({
      about: 'Software engineer',
      phone: '+1234567890',
      location: 'San Francisco',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      githubUrl: 'https://github.com/johndoe',
      websiteUrl: 'https://johndoe.com'
    });
    expect(profile.about).toBe('Software engineer');
    expect(profile.phone).toBe('+1234567890');
    expect(profile.location).toBe('San Francisco');
    expect(profile.linkedinUrl).toBe('https://linkedin.com/in/johndoe');
    expect(profile.githubUrl).toBe('https://github.com/johndoe');
    expect(profile.websiteUrl).toBe('https://johndoe.com');
  });

  test('defaults nullable fields to null', () => {
    const profile = makeProfile();
    expect(profile.about).toBeNull();
    expect(profile.phone).toBeNull();
    expect(profile.location).toBeNull();
    expect(profile.linkedinUrl).toBeNull();
    expect(profile.githubUrl).toBeNull();
    expect(profile.websiteUrl).toBeNull();
  });
});
