import type { TokenIssuer } from '@tailoredin/application';
import { Elysia } from 'elysia';

export type AuthContext = { auth: { accountId: string; profileId: string } };

export function authMiddleware(tokenIssuer: TokenIssuer) {
  return new Elysia({ name: 'auth' }).derive({ as: 'scoped' }, ({ request }) => {
    const header = request.headers.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new Error('UNAUTHORIZED');
    }
    const token = header.slice(7);
    try {
      const payload = tokenIssuer.verify(token);
      return { auth: payload };
    } catch {
      throw new Error('UNAUTHORIZED');
    }
  });
}
