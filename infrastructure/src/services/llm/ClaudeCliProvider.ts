import { injectable } from '@needle-di/core';
import { Logger } from '@tailoredin/core';
import type { z } from 'zod';
import { BaseLlmCliProvider } from './BaseLlmCliProvider.js';
import { type ClaudeCliResponse, claudeCliResponseSchema } from './ClaudeCliResponse.js';
import type { LlmJsonRequest } from './LlmJsonRequest.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

@injectable()
export class ClaudeCliProvider extends BaseLlmCliProvider<typeof claudeCliResponseSchema> {
  protected readonly log: LoggerInstance = Logger.create(this);
  protected readonly responseSchema = claudeCliResponseSchema;

  protected buildCommand(request: LlmJsonRequest<z.ZodObject<z.ZodRawShape>>, jsonSchema: string): string[] {
    const cmd = ['claude', '-p', request.prompt, '--output-format', 'json', '--json-schema', jsonSchema];
    if (request.model) cmd.push('--model', request.model);
    return cmd;
  }

  protected extractResult(response: ClaudeCliResponse): unknown {
    if (response.is_error) {
      return null;
    }

    if (response.structured_output != null) {
      return response.structured_output;
    }

    const raw = response.result;
    if (raw === '' || raw == null) {
      return null;
    }

    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
}
