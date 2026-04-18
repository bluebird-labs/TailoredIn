export class ExternalServiceError extends Error {
  public readonly statusCode = 502;
  public readonly code = 'EXTERNAL_SERVICE_ERROR';

  public constructor(service: string, message: string) {
    super(`${service}: ${message}`);
  }
}
