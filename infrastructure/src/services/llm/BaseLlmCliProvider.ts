import type { Logger } from '@tailoredin/core';
import { err, ok, type Result } from '@tailoredin/domain';
import type { z } from 'zod';
import type { LlmJsonRequest } from './LlmJsonRequest.js';
import { LlmRequestError } from './LlmRequestError.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

export interface LlmRequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export abstract class BaseLlmCliProvider<TResponse extends z.ZodType> {
  protected abstract readonly log: LoggerInstance;
  protected abstract readonly responseSchema: TResponse;

  protected abstract buildCommand(request: LlmJsonRequest<z.ZodObject<z.ZodRawShape>>, jsonSchema: string): string[];

  protected abstract extractResult(response: z.infer<TResponse>): unknown;

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

      // Only retry retryable failures: spawn errors, timeouts, non-zero exit codes
      // Do NOT retry Zod validation failures, extraction failures, or empty results
      if (!this.isRetryable(lastError)) {
        return result;
      }

      if (attempt < maxRetries) {
        const retryDelayMs = options?.retryDelayMs ?? 2_000;
        const delay = retryDelayMs * 2 ** (attempt - 1);
        const msg = `LLM request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${lastError.message}`;
        this.log.info(msg);
        await this.sleep(delay);
      }
    }

    return err(lastError!);
  }

  private isRetryable(error: LlmRequestError): boolean {
    const msg = error.message;
    // Retryable: spawn failures, timeouts, non-zero exit codes
    if (msg.includes('Failed to spawn CLI')) return true;
    if (msg.includes('timed out')) return true;
    if (msg.startsWith('CLI exited with code')) return true;
    // Not retryable: Zod validation, extraction, empty results
    return false;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeOnce<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>,
    options?: LlmRequestOptions
  ): Promise<Result<z.infer<T>, LlmRequestError>> {
    const timeoutMs = options?.timeoutMs ?? 60_000;
    const jsonSchema = request.getJsonSchema();
    const command = this.buildCommand(request, jsonSchema);
    const start = performance.now();

    this.log.debug(`LLM request | command: ${this.formatCommand(command)}`);

    let stdout: string;
    let stderr: string;
    let exitCode: number;

    try {
      const proc = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });

      let timer: Timer;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          proc.kill();
          reject(new Error(`CLI process timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const processPromise = (async () => {
        const out = await new Response(proc.stdout).text();
        const errOut = await new Response(proc.stderr).text();
        const code = await proc.exited;
        return { out, errOut, code };
      })();

      const result = await Promise.race([processPromise, timeoutPromise]);
      clearTimeout(timer!);
      stdout = result.out;
      stderr = result.errOut;
      exitCode = result.code;
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const message =
        e instanceof Error && e.message.includes('timed out')
          ? e.message
          : `Failed to spawn CLI: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, null, '', '', duration));
    }

    const duration = Math.round(performance.now() - start);

    this.log.debug(
      `LLM response | duration=${duration}ms stdout="${stdout.slice(0, 1000)}" stderr="${stderr.slice(0, 500)}"`
    );

    if (exitCode !== 0) {
      return err(new LlmRequestError(`CLI exited with code ${exitCode}`, command, exitCode, stdout, stderr, duration));
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch (e) {
      const message = `Failed to parse stdout as JSON: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    const responseParsed = this.responseSchema.safeParse(parsed);

    if (!responseParsed.success) {
      const message = `Response validation failed: ${responseParsed.error.issues.map((i: z.ZodIssue) => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    let extracted: unknown;
    try {
      extracted = this.extractResult(responseParsed.data);
    } catch (e) {
      const message = `Failed to extract result: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    if (extracted == null) {
      return err(new LlmRequestError('Empty result from LLM', command, exitCode, stdout, stderr, duration));
    }

    const dataParsed = request.schema.safeParse(extracted);

    if (!dataParsed.success) {
      const message = `Zod validation failed: ${dataParsed.error.issues.map((i: z.ZodIssue) => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    return ok(dataParsed.data as z.infer<T>);
  }

  private formatCommand(command: string[]): string {
    return command.map(a => (a.includes(' ') || a.includes('"') ? `'${a}'` : a)).join(' ');
  }
}
