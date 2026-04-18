import { JwtTokenIssuer } from '../../src/auth/JwtTokenIssuer.js';

describe('JwtTokenIssuer', () => {
  const secret = 'test-secret-key-for-jwt-signing';
  const issuer = new JwtTokenIssuer(secret, 3600);

  test('issue returns a token and expiresIn', () => {
    const payload = { accountId: 'acc-123', profileId: 'prof-456' };
    const result = issuer.issue(payload);
    expect(typeof result.token).toBe('string');
    expect(result.token.split('.')).toHaveLength(3);
    expect(result.expiresIn).toBe(3600);
  });

  test('verify decodes a valid token correctly', () => {
    const payload = { accountId: 'acc-123', profileId: 'prof-456' };
    const { token } = issuer.issue(payload);
    const decoded = issuer.verify(token);
    expect(decoded.accountId).toBe('acc-123');
    expect(decoded.profileId).toBe('prof-456');
  });

  test('verify throws on invalid token', () => {
    expect(() => issuer.verify('invalid.token.here')).toThrow();
  });

  test('verify throws on expired token', () => {
    const expiredIssuer = new JwtTokenIssuer(secret, -1);
    const { token } = expiredIssuer.issue({ accountId: 'acc-123', profileId: 'prof-456' });
    expect(() => issuer.verify(token)).toThrow('Token expired');
  });
});
