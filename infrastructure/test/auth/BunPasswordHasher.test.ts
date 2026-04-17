import { BunPasswordHasher } from '../../src/auth/BunPasswordHasher.js';

// TODO: S4 replaces BunPasswordHasher with Argon2PasswordHasher
describe.skip('BunPasswordHasher', () => {
  const hasher = new BunPasswordHasher();

  test('hash returns a non-empty string different from input', async () => {
    const password = 'my-secret-password';
    const hashed = await hasher.hash(password);
    expect(hashed).toBeString();
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
