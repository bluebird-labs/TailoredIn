import { Argon2PasswordHasher } from '../../src/auth/Argon2PasswordHasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  test('hash returns a non-empty string different from input', async () => {
    const password = 'my-secret-password';
    const hashed = await hasher.hash(password);
    expect(typeof hashed).toBe('string');
    expect(hashed.length).toBeGreaterThan(0);
    expect(hashed).not.toBe(password);
  });

  test('verify returns true for correct password', async () => {
    const password = 'correct-password';
    const hashed = await hasher.hash(password);
    const result = await hasher.verify(password, hashed);
    expect(result).toBe(true);
  });

  test('verify returns false for wrong password', async () => {
    const password = 'correct-password';
    const hashed = await hasher.hash(password);
    const result = await hasher.verify('wrong-password', hashed);
    expect(result).toBe(false);
  });
});
