export class ValidationError extends Error {
  public readonly field: string;
  public readonly reason: string;

  public constructor(field: string, reason: string) {
    super(`${field}: ${reason}`);
    this.name = 'ValidationError';
    this.field = field;
    this.reason = reason;
  }
}
