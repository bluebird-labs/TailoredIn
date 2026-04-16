export interface TokenIssuer {
  issue(payload: { accountId: string; profileId: string }): { token: string; expiresIn: number };
  verify(token: string): { accountId: string; profileId: string };
}
