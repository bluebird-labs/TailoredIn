import { describe, expect, test } from 'bun:test';
import { User, UserId, type UserRepository } from '@tailoredin/domain';
import { GetUser } from '../../src/use-cases/GetUser.js';

const NOW = new Date('2025-01-01');

function makeUser(overrides?: Partial<{ id: string; email: string }>): User {
  return new User({
    id: new UserId(overrides?.id ?? 'user-1'),
    email: overrides?.email ?? 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    phoneNumber: '+1-555-0100',
    githubHandle: 'janedoe',
    linkedinHandle: 'janedoe',
    locationLabel: 'New York, NY',
    createdAt: NOW,
    updatedAt: NOW
  });
}

function mockUserRepository(user: User): UserRepository {
  return {
    findByIdOrFail: async (id: string) => {
      if (id !== user.id.value) throw new Error('Not found');
      return user;
    },
    findSingle: async () => user,
    save: async () => {}
  };
}

describe('GetUser', () => {
  test('returns user DTO for valid id', async () => {
    const user = makeUser();
    const useCase = new GetUser(mockUserRepository(user));

    const dto = await useCase.execute({ userId: 'user-1' });

    expect(dto.id).toBe('user-1');
    expect(dto.email).toBe('jane@example.com');
    expect(dto.firstName).toBe('Jane');
    expect(dto.lastName).toBe('Doe');
    expect(dto.phoneNumber).toBe('+1-555-0100');
    expect(dto.githubHandle).toBe('janedoe');
    expect(dto.linkedinHandle).toBe('janedoe');
    expect(dto.locationLabel).toBe('New York, NY');
  });

  test('throws when user not found', async () => {
    const user = makeUser();
    const useCase = new GetUser(mockUserRepository(user));

    expect(useCase.execute({ userId: 'nonexistent' })).rejects.toThrow('Not found');
  });
});
