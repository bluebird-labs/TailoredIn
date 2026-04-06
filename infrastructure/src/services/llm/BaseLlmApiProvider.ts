import type { Logger } from '@tailoredin/core';
import { err, ok, type Result } from '@tailoredin/domain';
import type { z } from 'zod';
import type { LlmRequestOptions } from './LlmRequestOptions.js';
import type { LlmJsonRequest } from './LlmJsonRequest.js';
import { LlmRequestError } from './LlmRequestError.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

const DEFAULT_MAX_TOKENS = 4096;

export abstract class BaseLlmApiProvider {
  protected abstract readonly log: LoggerInstance;
  protected abstract readonly defaultModel: string;
  protected abstract readonly providerName: string;

  /**
   * Perform the HTTP call to the LLM API.
   * @param prompt     The user-facing prompt text.
   * @param jsonSchema OpenAPI3-compatible JSON schema string (from request.getJsonSchema()).
   * @param model      Resolved model name (request.model ?? this.defaultModel).
   * @param maxTokens  Maximum tokens in the response (request.maxTokens ?? DEFAULT_MAX_TOKENS).
   * @param timeoutMs  Hard deadline for the call in milliseconds.
   * @returns Raw response text that should be parseable as JSON.
   * @throws Any thrown error signals a failed attempt; the message drives retryability.
   */
  protected abstract callApi(
    prompt: string,
    jsonSchema: string,
    model: string,
    maxTokens: number,
    timeoutMs: number
  ): Promise<string>;

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
    const jsonSchema = request.getJsonSchema();
    const model = request.model ?? this.defaultModel;
    const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
    const descriptor = [this.providerName, model, 'messages'];
    const start = performance.now();

    this.log.debug(`LLM API request | model: ${model} maxTokens: ${maxTokens}`);

    let rawText: string;
    try {
      rawText = await this.callApi(request.prompt, jsonSchema, model, maxTokens, timeoutMs);
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const msg = e instanceof Error ? e.message : String(e);
      return err(new LlmRequestError(msg, descriptor, null, '', '', duration));
    }

    const duration = Math.round(performance.now() - start);
    this.log.debug(`LLM API response | duration=${duration}ms text="${rawText.slice(0, 1000)}"`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const message = `Failed to parse API response as JSON: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, descriptor, null, rawText, '', duration));
    }

    const dataParsed = request.schema.safeParse(parsed);
    if (!dataParsed.success) {
      const message = `Zod validation failed: ${dataParsed.error.issues.map((i: z.ZodIssue) => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
      return err(new LlmRequestError(message, descriptor, null, rawText, '', duration));
    }

    return ok(dataParsed.data as z.infer<T>);
  }

  private isRetryable(error: LlmRequestError): boolean {
    const msg = error.message;
    if (msg.includes('API call timed out')) return true;
    if (msg.includes('API connection failed')) return true;
    if (msg.includes('API server error')) return true;
    if (msg.includes('API rate limit')) return true;
    return false;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
