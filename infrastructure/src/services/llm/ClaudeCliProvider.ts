import { injectable } from '@needle-di/core';
import { Logger } from '@tailoredin/core';
import type { z } from 'zod';
import { BaseLlmCliProvider } from './BaseLlmCliProvider.js';
import type { ClaudeCliResponse } from './ClaudeCliResponse.js';
import type { LlmJsonRequest } from './LlmJsonRequest.js';
import { stripCodeFences } from './strip-code-fences.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

@injectable()
export class ClaudeCliProvider extends BaseLlmCliProvider {
  protected readonly log: LoggerInstance = Logger.create(this);

  protected buildCommand(request: LlmJsonRequest<z.ZodObject<z.ZodRawShape>>, jsonSchema: string): string[] {
    return ['claude', '-p', request.prompt, '--output-format', 'json', '--json-schema', jsonSchema];
  }

  protected extractResult(stdout: string): unknown {
    const response = JSON.parse(stdout) as ClaudeCliResponse;

    if (response.is_error) {
      return null;
    }

    const raw = response.result;
    if (raw === '' || raw == null) {
      return null;
    }

    return typeof raw === 'string' ? JSON.parse(stripCodeFences(raw)) : raw;
  }
}
