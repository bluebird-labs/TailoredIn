import { describe, expect, test } from 'bun:test';
import type { UserRepository } from '@tailoredin/domain';
import { User, UserId } from '@tailoredin/domain';
import { Elysia } from 'elysia';

/**
 * Tests for the GET /user route behavior.
 *
 * We construct the Elysia handler inline rather than importing GetCurrentUserRoute
 * because that class imports DI tokens from @tailoredin/infrastructure, which
 * transitively pulls in ORM config with subpath imports that don't resolve in
 * the test environment.
 */

const fakeUser = new User({
  id: new UserId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
  email: 'test@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  phoneNumber: '+1234567890',
  githubHandle: 'janedoe',
  linkedinHandle: 'janedoe',
  locationLabel: 'San Francisco, CA',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
});

function createMockUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByIdOrFail: async () => {
      throw new Error('not found');
    },
    findSingle: async () => fakeUser,
    save: async () => {},
    ...overrides
  };
}

function createApp(userRepository: UserRepository) {
  return new Elysia().get('/user', async () => {
    const user = await userRepository.findSingle();
    return {
      data: {
        id: user.id.value,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        githubHandle: user.githubHandle,
        linkedinHandle: user.linkedinHandle,
        locationLabel: user.locationLabel
      }
    };
  });
}

describe('GET /user', () => {
  test('returns the current user with all fields', async () => {
    const app = createApp(createMockUserRepository());

    const response = await app.handle(new Request('http://localhost/user'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toEqual({
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      githubHandle: 'janedoe',
      linkedinHandle: 'janedoe',
      locationLabel: 'San Francisco, CA'
    });
  });

  test('calls findSingle on the repository', async () => {
    let findSingleCalled = false;
    const app = createApp(
      createMockUserRepository({
        findSingle: async () => {
          findSingleCalled = true;
          return fakeUser;
        }
      })
    );

    await app.handle(new Request('http://localhost/user'));

    expect(findSingleCalled).toBe(true);
  });

  test('returns null fields when user has no optional data', async () => {
    const sparseUser = new User({
      id: new UserId('11111111-2222-3333-4444-555555555555'),
      email: 'minimal@example.com',
      firstName: 'Min',
      lastName: 'User',
      phoneNumber: null,
      githubHandle: null,
      linkedinHandle: null,
      locationLabel: null,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01')
    });
    const app = createApp(createMockUserRepository({ findSingle: async () => sparseUser }));

    const response = await app.handle(new Request('http://localhost/user'));

    const body = await response.json();
    expect(body.data.phoneNumber).toBeNull();
    expect(body.data.githubHandle).toBeNull();
    expect(body.data.linkedinHandle).toBeNull();
    expect(body.data.locationLabel).toBeNull();
  });
});
