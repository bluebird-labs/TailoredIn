import { describe, expect, test } from 'bun:test';
import { User, UserId, type UserRepository } from '@tailoredin/domain';
import { UpdateUser } from '../../src/use-cases/UpdateUser.js';

const NOW = new Date('2025-01-01');

function makeUser(): User {
  return new User({
    id: new UserId('user-1'),
    email: 'old@example.com',
    firstName: 'Old',
    lastName: 'Name',
    phoneNumber: null,
    githubHandle: null,
    linkedinHandle: null,
    locationLabel: null,
    createdAt: NOW,
    updatedAt: NOW
  });
}

describe('UpdateUser', () => {
  test('updates all fields and returns updated DTO', async () => {
    const user = makeUser();
    let savedUser: User | undefined;

    const repo: UserRepository = {
      findByIdOrFail: async () => user,
      findSingle: async () => user,
      save: async (u: User) => {
        savedUser = u;
      }
    };

    const useCase = new UpdateUser(repo);
    const dto = await useCase.execute({
      userId: 'user-1',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'Person',
      phoneNumber: '+1-555-0200',
      githubHandle: 'newgithub',
      linkedinHandle: 'newlinkedin',
      locationLabel: 'San Francisco, CA'
    });

    expect(dto.email).toBe('new@example.com');
    expect(dto.firstName).toBe('New');
    expect(dto.lastName).toBe('Person');
    expect(dto.phoneNumber).toBe('+1-555-0200');
    expect(dto.githubHandle).toBe('newgithub');
    expect(dto.linkedinHandle).toBe('newlinkedin');
    expect(dto.locationLabel).toBe('San Francisco, CA');
    expect(savedUser).toBeDefined();
    expect(savedUser!.updatedAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  test('throws when user not found', async () => {
    const repo: UserRepository = {
      findByIdOrFail: async () => {
        throw new Error('Not found');
      },
      findSingle: async () => {
        throw new Error('Not found');
      },
      save: async () => {}
    };

    const useCase = new UpdateUser(repo);

    expect(
      useCase.execute({
        userId: 'nonexistent',
        email: 'x@x.com',
        firstName: 'X',
        lastName: 'X',
        phoneNumber: null,
        githubHandle: null,
        linkedinHandle: null,
        locationLabel: null
      })
    ).rejects.toThrow('Not found');
  });
});
