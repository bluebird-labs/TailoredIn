import { Account, type AccountRepository, type PasswordHasher } from '@tailoredin/domain';
import { AuthenticationError } from '../../../src/errors/AuthenticationError.js';
import type { TokenIssuer } from '../../../src/ports/TokenIssuer.js';
import { Login } from '../../../src/use-cases/auth/Login.js';

const ACCOUNT_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const PROFILE_ID = 'bbbbbbbb-1111-2222-3333-444444444444';

function makeAccount(): Account {
  return new Account({
    id: ACCOUNT_ID,
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    profileId: PROFILE_ID,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function makeMocks(
  overrides: { findByEmail?: AccountRepository['findByEmail']; verify?: PasswordHasher['verify'] } = {}
) {
  const accountRepository: AccountRepository = {
    findByEmail: overrides.findByEmail ?? jest.fn(async () => makeAccount()),
    findByIdOrFail: jest.fn(async () => makeAccount()),
    save: jest.fn(async () => {})
  };

  const passwordHasher: PasswordHasher = {
    hash: jest.fn(async () => 'hashed'),
    verify: overrides.verify ?? jest.fn(async () => true)
  };

  const tokenIssuer: TokenIssuer = {
    issue: jest.fn(() => ({ token: 'jwt-token', expiresIn: 3600 })),
    verify: jest.fn(() => ({ accountId: ACCOUNT_ID, profileId: PROFILE_ID }))
  };

  return { accountRepository, passwordHasher, tokenIssuer };
}

describe('Login', () => {
  test('returns token on valid credentials', async () => {
    const { accountRepository, passwordHasher, tokenIssuer } = makeMocks();
    const useCase = new Login(accountRepository, passwordHasher, tokenIssuer);

    const result = await useCase.execute({ email: 'user@example.com', password: 'correct-password' });

    expect(result.token).toBe('jwt-token');
    expect(result.expiresIn).toBe(3600);
    expect(tokenIssuer.issue).toHaveBeenCalledWith({ accountId: ACCOUNT_ID, profileId: PROFILE_ID });
  });

  test('throws AuthenticationError on unknown email', async () => {
    const { accountRepository, passwordHasher, tokenIssuer } = makeMocks({
      findByEmail: jest.fn(async () => null)
    });
    const useCase = new Login(accountRepository, passwordHasher, tokenIssuer);

    await expect(useCase.execute({ email: 'unknown@example.com', password: 'any' })).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  test('throws AuthenticationError on wrong password', async () => {
    const { accountRepository, passwordHasher, tokenIssuer } = makeMocks({
      verify: jest.fn(async () => false)
    });
    const useCase = new Login(accountRepository, passwordHasher, tokenIssuer);

    await expect(useCase.execute({ email: 'user@example.com', password: 'wrong' })).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });
});
