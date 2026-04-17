import { createHmac } from 'node:crypto';
import type { TokenIssuer } from '@tailoredin/application';

function base64url(data: string | Uint8Array): string {
  const str = typeof data === 'string' ? btoa(data) : btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export class JwtTokenIssuer implements TokenIssuer {
  private readonly header: string;
  private readonly keyData: Uint8Array;

  public constructor(
    secret: string,
    private readonly expiresInSeconds: number
  ) {
    this.header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    this.keyData = new TextEncoder().encode(secret);
  }

  public issue(payload: { accountId: string; profileId: string }): { token: string; expiresIn: number } {
    const now = Math.floor(Date.now() / 1000);
    const body = base64url(
      JSON.stringify({
        accountId: payload.accountId,
        profileId: payload.profileId,
        iat: now,
        exp: now + this.expiresInSeconds
      })
    );
    const signature = this.sign(`${this.header}.${body}`);
    return { token: `${this.header}.${body}.${signature}`, expiresIn: this.expiresInSeconds };
  }

  public verify(token: string): { accountId: string; profileId: string } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const [header, body, signature] = parts;
    const expectedSignature = this.sign(`${header}.${body}`);
    if (signature !== expectedSignature) throw new Error('Invalid token signature');

    const decoded = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) throw new Error('Token expired');

    return { accountId: decoded.accountId, profileId: decoded.profileId };
  }

  private sign(input: string): string {
    const hmac = createHmac('sha256', this.keyData);
    hmac.update(input);
    return hmac.digest('base64url');
  }
}
