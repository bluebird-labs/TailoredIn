import { describe, expect, test } from 'bun:test';
import { User } from '../../src/entities/User.js';
import { UserId } from '../../src/value-objects/UserId.js';

describe('User', () => {
  const createProps = {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1 555 123 4567',
    githubHandle: 'johndoe',
    linkedinHandle: 'john-doe',
    locationLabel: 'New York, NY'
  };

  test('create generates id and timestamps', () => {
    const user = User.create(createProps);

    expect(user.id).toBeInstanceOf(UserId);
    expect(user.id.value).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.phoneNumber).toBe('+1 555 123 4567');
    expect(user.githubHandle).toBe('johndoe');
    expect(user.linkedinHandle).toBe('john-doe');
    expect(user.locationLabel).toBe('New York, NY');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  test('create handles nullable fields', () => {
    const user = User.create({
      ...createProps,
      phoneNumber: null,
      githubHandle: null,
      linkedinHandle: null,
      locationLabel: null
    });

    expect(user.phoneNumber).toBeNull();
    expect(user.githubHandle).toBeNull();
    expect(user.linkedinHandle).toBeNull();
    expect(user.locationLabel).toBeNull();
  });

  test('constructor reconstitutes from full props', () => {
    const id = new UserId('fixed-id');
    const now = new Date('2025-01-01');
    const user = new User({
      id,
      ...createProps,
      createdAt: now,
      updatedAt: now
    });

    expect(user.id.value).toBe('fixed-id');
    expect(user.createdAt).toBe(now);
  });

  test('equals compares by id', () => {
    const id = new UserId('same-id');
    const now = new Date();
    const a = new User({ id, ...createProps, createdAt: now, updatedAt: now });
    const b = new User({ id, ...createProps, email: 'other@example.com', createdAt: now, updatedAt: now });
    expect(a.equals(b)).toBe(true);
  });

  test('not equal with different id', () => {
    const a = User.create(createProps);
    const b = User.create(createProps);
    expect(a.equals(b)).toBe(false);
  });
});
