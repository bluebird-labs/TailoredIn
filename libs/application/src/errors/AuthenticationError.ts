export class AuthenticationError extends Error {
  public readonly statusCode = 401;
  public readonly code = 'UNAUTHORIZED';
  public constructor() {
    super('Invalid email or password');
  }
}
