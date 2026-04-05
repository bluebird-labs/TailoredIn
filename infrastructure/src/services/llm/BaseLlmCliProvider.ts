import type { Logger } from '@tailoredin/core';
import { err, ok, type Result } from '@tailoredin/domain';
import type { z } from 'zod';
import type { LlmJsonRequest } from './LlmJsonRequest.js';
import { LlmRequestError } from './LlmRequestError.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

export interface LlmRequestOptions {
  timeoutMs?: number;
}

export abstract class BaseLlmCliProvider {
  protected abstract readonly log: LoggerInstance;

  protected abstract buildCommand(request: LlmJsonRequest<z.ZodObject<z.ZodRawShape>>, jsonSchema: string): string[];

  protected abstract extractResult(stdout: string): unknown;

  public async request<T extends z.ZodObject<z.ZodRawShape>>(
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

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
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
      stdout = result.out;
      stderr = result.errOut;
      exitCode = result.code;
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const message = e instanceof Error && e.message.includes('timed out')
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

    let extracted: unknown;
    try {
      extracted = this.extractResult(stdout);
    } catch (e) {
      const message = `Failed to extract result: ${e instanceof Error ? e.message : String(e)}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    if (extracted == null) {
      return err(new LlmRequestError('Empty result from LLM', command, exitCode, stdout, stderr, duration));
    }

    const parsed = request.schema.safeParse(extracted);

    if (!parsed.success) {
      const message = `Zod validation failed: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
      return err(new LlmRequestError(message, command, exitCode, stdout, stderr, duration));
    }

    return ok(parsed.data as z.infer<T>);
  }

  private formatCommand(command: string[]): string {
    return command.map(a => (a.includes(' ') || a.includes('"') ? `'${a}'` : a)).join(' ');
  }
}
