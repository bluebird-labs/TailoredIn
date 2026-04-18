import { Account } from '../../src/entities/Account.js';
import type { PasswordHasher } from '../../src/ports/PasswordHasher.js';

describe('Account', () => {
  const makeAccount = (overrides?: Partial<Parameters<typeof Account.create>[0]>) =>
    Account.create({
      email: 'john@example.com',
      passwordHash: '$argon2id$hashed',
      profileId: crypto.randomUUID(),
      ...overrides
    });

  test('creates with generated id and timestamps', () => {
    const account = makeAccount();
    expect(account.id).toBeDefined();
    expect(account.email).toBe('john@example.com');
    expect(account.passwordHash).toBe('$argon2id$hashed');
    expect(account.profileId).toBeDefined();
    expect(account.createdAt).toBeInstanceOf(Date);
    expect(account.updatedAt).toBeInstanceOf(Date);
  });

  test('rejects invalid email', () => {
    expect(() => makeAccount({ email: 'not-an-email' })).toThrow('email');
  });

  test('rejects empty email', () => {
    expect(() => makeAccount({ email: '' })).toThrow('email');
  });

  test('verifyPassword delegates to PasswordHasher', async () => {
    const account = makeAccount({ passwordHash: '$argon2id$hashed' });
    const hasher: PasswordHasher = {
      hash: jest.fn(() => Promise.resolve('')),
      verify: jest.fn((password: string, hash: string) =>
        Promise.resolve(password === 'correct' && hash === '$argon2id$hashed')
      )
    };

    expect(await account.verifyPassword('correct', hasher)).toBe(true);
    expect(await account.verifyPassword('wrong', hasher)).toBe(false);
    expect(hasher.verify).toHaveBeenCalledTimes(2);
  });
});
