import { ExternalServiceError } from '../../src/errors/ExternalServiceError.js';

describe('ExternalServiceError', () => {
  test('has statusCode 502', () => {
    const error = new ExternalServiceError('Claude CLI', 'Search failed');
    expect(error.statusCode).toBe(502);
  });

  test('has code EXTERNAL_SERVICE_ERROR', () => {
    const error = new ExternalServiceError('Claude CLI', 'Search failed');
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  test('formats message with service name', () => {
    const error = new ExternalServiceError('Claude CLI', 'Search failed');
    expect(error.message).toBe('Claude CLI: Search failed');
  });

  test('is instanceof Error', () => {
    const error = new ExternalServiceError('Claude CLI', 'Search failed');
    expect(error).toBeInstanceOf(Error);
  });
});
