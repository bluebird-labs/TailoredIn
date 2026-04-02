import { execFile } from 'node:child_process';
import type { StructuredLlmRequest } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import type { ZodTypeAny, z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { LlmProviderBackend } from './LlmProviderBackend.js';

const logger = Logger.create('ClaudeCliLlmProvider');

export type CommandRunner = (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string }>;

const defaultRunner: CommandRunner = (cmd, args) =>
  new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Claude CLI failed (exit ${error.code}): ${stderr}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });

export class ClaudeCliLlmProvider implements LlmProviderBackend {
  private readonly run: CommandRunner;

  public constructor(runner?: CommandRunner) {
    this.run = runner ?? defaultRunner;
  }

  public async generate<TInput extends z.ZodType, TOutput extends z.ZodType>(
    request: Omit<StructuredLlmRequest<TInput, TOutput>, 'provider'>
  ): Promise<z.infer<TOutput>> {
    const context = request.inputSchema.parse(request.context);
    const jsonSchema = zodToJsonSchema(request.outputSchema, 'output');

    const fullPrompt = [
      request.prompt,
      '',
      '## Context',
      '```json',
      JSON.stringify(context, null, 2),
      '```',
      '',
      '## Output format',
      'Respond with ONLY valid JSON matching this JSON Schema (no markdown fences, no extra text):',
      '```json',
      JSON.stringify(jsonSchema.definitions?.output ?? jsonSchema, null, 2),
      '```'
    ].join('\n');

    const { stdout, stderr } = await this.run('claude', ['-p', fullPrompt, '--output-format', 'json']);

    if (stderr) {
      logger.warn('Claude CLI stderr:', stderr);
    }

    return (request.outputSchema as ZodTypeAny).parse(this.parseResponse(stdout));
  }

  private parseResponse(stdout: string): unknown {
    const cliResponse = JSON.parse(stdout);
    const resultText: string = cliResponse.result ?? cliResponse;

    if (typeof resultText === 'string') {
      const cleaned = resultText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      return JSON.parse(cleaned);
    }

    return resultText;
  }
}
