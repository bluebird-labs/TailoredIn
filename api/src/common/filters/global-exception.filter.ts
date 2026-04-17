import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, UnauthorizedException } from '@nestjs/common';
import { AuthenticationError, ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodIssue } from 'zod';

const log = Logger.create('ExceptionFilter');

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ZodValidationException) {
      response.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: (exception.getZodError() as { errors: ZodIssue[] }).errors.map(e => e.message).join(', ')
        }
      });
      return;
    }

    if (exception instanceof UnauthorizedException) {
      response.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    if (exception instanceof AuthenticationError) {
      response.status(401).json({
        error: { code: exception.code, message: exception.message }
      });
      return;
    }

    if (exception instanceof ExternalServiceError) {
      response.status(exception.statusCode).json({
        error: { code: exception.code, message: exception.message }
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'error' in body) {
        response.status(status).json(body);
        return;
      }
      response.status(status).json({
        error: { code: 'HTTP_ERROR', message: exception.message }
      });
      return;
    }

    log.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
}
