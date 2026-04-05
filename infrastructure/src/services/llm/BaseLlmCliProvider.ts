import type { Logger } from '@tailoredin/core';
import { err, ok, type Result } from '@tailoredin/domain';
import type { z } from 'zod';
import type { LlmJsonRequest } from './LlmJsonRequest.js';
import { LlmRequestError } from './LlmRequestError.js';

type LoggerInstance = ReturnType<typeof Logger.create>;

export abstract class BaseLlmCliProvider<TResponse extends z.ZodType> {
  protected abstract readonly log: LoggerInstance;
  protected abstract readonly responseSchema: TResponse;

  protected abstract buildCommand(request: LlmJsonRequest<z.ZodObject<z.ZodRawShape>>, jsonSchema: string): string[];

  protected abstract extractResult(response: z.infer<TResponse>): unknown;

  public async request<T extends z.ZodObject<z.ZodRawShape>>(
    request: LlmJsonRequest<T>
  ): Promise<Result<z.infer<T>, LlmRequestError>> {
    const jsonSchema = request.getJsonSchema();
    const command = this.buildCommand(request, jsonSchema);
    const start = performance.now();

    this.log.debug(`LLM request | command: ${this.formatCommand(command)}`);

    let stdout: string;
    let stderr: string;
    let exitCode: number;

    try {
      const proc = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });
      stdout = await new Response(proc.stdout).text();
      stderr = await new Response(proc.stderr).text();
      exitCode = await proc.exited;
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const message = `Failed to spawn CLI: ${e instanceof Error ? e.message : String(e)}`;
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
