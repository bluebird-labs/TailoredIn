import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Logger } from '@tailoredin/core';
import { err, ok, type Result } from '@tailoredin/domain';
import type { z } from 'zod';
import type { LlmJsonRequest } from './LlmJsonRequest.js';
import { LlmRequestError } from './LlmRequestError.js';
import type { LlmRequestOptions } from './LlmRequestOptions.js';

const LOG_DIR = resolve(import.meta.dirname, '../../../logs/llm');
const IS_TEST = process.env.NODE_ENV === 'test';

type LoggerInstance = ReturnType<typeof Logger.create>;

const DEFAULT_MAX_TOKENS = 4096;

export abstract class BaseLlmApiProvider {
  protected abstract readonly log: LoggerInstance;
  protected abstract readonly defaultModel: string;
  protected abstract readonly providerName: string;

  /**
   * Perform the HTTP call to the LLM API and return the validated, parsed response.
   * @param prompt     The user-facing prompt text.
   * @param schema     Zod schema defining the expected response structure.
   * @param model      Resolved model name (request.model ?? this.defaultModel).
   * @param maxTokens  Maximum tokens in the response (request.maxTokens ?? DEFAULT_MAX_TOKENS).
   * @param timeoutMs  Hard deadline for the call in milliseconds.
   * @throws Any thrown error signals a failed attempt; the message drives retryability.
   */
  protected abstract callApi<T extends z.ZodObject<z.ZodRawShape>>(
    prompt: string,
    schema: T,
    model: string,
    maxTokens: number,
    timeoutMs: number
  ): Promise<z.infer<T>>;

  public async request<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    options?: LlmRequestOptions
  ): Promise<Result<z.infer<T>, LlmRequestError>> {
    const maxRetries = options?.maxRetries ?? 3;
    let lastError: LlmRequestError | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.executeOnce(request, options);

      if (result.isOk) {
        return result;
      }

      lastError = result.error;

      if (!this.isRetryable(lastError)) {
        return result;
      }

      if (attempt < maxRetries) {
        const retryDelayMs = options?.retryDelayMs ?? 2_000;
        const delay = retryDelayMs * 2 ** (attempt - 1);
        this.log.info(
          `LLM API request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${lastError.message}`
        );

        if (lastError.message.startsWith('Schema validation failed:')) {
          request.previousValidationErrors.push(lastError.message.replace('Schema validation failed: ', ''));
        }

        await this.sleep(delay);
      }
    }

    return err(lastError!);
  }

  private async executeOnce<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    options?: LlmRequestOptions
  ): Promise<Result<z.infer<T>, LlmRequestError>> {
    const timeoutMs = options?.timeoutMs ?? 60_000;
    const model = request.model ?? this.defaultModel;
    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
    const descriptor = [this.providerName, model, 'messages'];
    const start = performance.now();

    this.log.debug(`LLM API request | model: ${model} maxTokens: ${maxTokens}`);

    let raw: z.infer<T>;
    try {
      raw = await this.callApi(request.prompt, request.schema, model, maxTokens, timeoutMs);
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const msg = e instanceof Error ? e.message : String(e);
      this.logToFile(request, model, maxTokens, duration, { error: msg });
      return err(new LlmRequestError(msg, descriptor, null, '', '', duration));
    }

    const duration = Math.round(performance.now() - start);
    this.log.debug(`LLM API response | duration=${duration}ms`);

    const parsed = request.schema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      this.log.warn(`LLM response failed schema validation: ${issues}`);
      this.logToFile(request, model, maxTokens, duration, {
        error: `Schema validation failed: ${issues}\n\nRaw response:\n${JSON.stringify(raw, null, 2)}`
      });
      return err(new LlmRequestError(`Schema validation failed: ${issues}`, descriptor, null, '', '', duration));
    }

    this.logToFile(request, model, maxTokens, duration, { data: parsed.data });
    return ok(parsed.data);
  }

  private isRetryable(error: LlmRequestError): boolean {
    const msg = error.message;
    if (msg.includes('API call timed out')) return true;
    if (msg.includes('API connection failed')) return true;
    if (msg.includes('API service overloaded')) return true;
    if (msg.includes('API server error')) return true;
    if (msg.includes('API rate limit')) return true;
    if (msg.includes('Schema validation failed')) return true;
    if (msg.includes('Failed to parse structured output')) return true;
    return false;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logToFile<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    model: string,
    maxTokens: number,
    durationMs: number,
    result: { data: z.infer<T> } | { error: string }
  ): void {
    if (IS_TEST) return;
    try {
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true });
      }

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const requestClass = request.constructor.name;
      const filename = `${timestamp}_${requestClass}.md`;

      const input = request.getInput();

      const sections = [
        `# ${requestClass}`,
        `**Date:** ${now.toISOString()}`,
        `**Model:** ${model}`,
        `**Max Tokens:** ${maxTokens}`,
        `**Duration:** ${durationMs}ms`,
        `**Status:** ${'data' in result ? 'SUCCESS' : 'FAILURE'}`,
        '',
        '## Input',
        '',
        input ? `\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\`` : '*No structured input available*',
        '',
        '## Output Schema',
        '',
        `\`\`\`json\n${JSON.stringify(request.getJsonSchema(), null, 2)}\n\`\`\``,
        '',
        '## Prompt',
        '',
        request.prompt,
        '',
        '## Response',
        '',
        'data' in result ? `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`` : `**Error:** ${result.error}`
      ];

      const filePath = resolve(LOG_DIR, filename);
      writeFileSync(filePath, sections.join('\n'), 'utf-8');
      this.log.debug(`LLM log written: ${filePath}`);
    } catch (error) {
      this.log.warn('Failed to write LLM prompt log file', { error });
    }
  }
}
