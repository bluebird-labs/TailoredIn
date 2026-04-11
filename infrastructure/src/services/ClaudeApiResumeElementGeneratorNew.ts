import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';
import { inject, injectable } from '@needle-di/core';
import type { ComposedPrompt, ResumeElementGenerator } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from './llm/ClaudeApiProvider.js';

const LOG_DIR = resolve(import.meta.dir, '../../../logs/llm');
const IS_TEST = process.env.NODE_ENV === 'test';

@injectable()
export class ClaudeApiResumeElementGenerator implements ResumeElementGenerator {
  private readonly log = Logger.create(this);

  public constructor(private readonly provider: ClaudeApiProvider = inject(DI.Llm.ClaudeApiProvider)) {}

  public async generate(composedPrompt: ComposedPrompt): Promise<unknown> {
    const systemContent = this.buildSystemContent(composedPrompt);
    const messages = this.buildMessages(composedPrompt);
    const model = composedPrompt.model as Anthropic.Messages.Model;
    const schema = composedPrompt.outputSchema as z.ZodObject<z.ZodRawShape>;

    this.log.info(`Generating element | model=${model} messages=${messages.length}`);
    const startTime = Date.now();

    try {
      // biome-ignore lint/suspicious/noExplicitAny: zodToJsonSchema return type doesn't match SDK's JsonSchema type
      const jsonSchema = zodToJsonSchema(schema, { target: 'jsonSchema7' }) as any;

      const client = this.provider.getClient();
      const response = await client.messages.parse(
        {
          model,
          max_tokens: 4096,
          system: systemContent,
          messages,
          output_config: { format: jsonSchemaOutputFormat(jsonSchema) }
        },
        { timeout: 300_000 }
      );

      const duration = Date.now() - startTime;
      this.log.info(`Element generated | duration=${duration}ms`);

      const parsed = schema.safeParse(response.parsed_output);
      if (!parsed.success) {
        const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        this.logToFile(composedPrompt, model, duration, {
          error: `Schema validation failed: ${issues}`,
          raw: response.parsed_output
        });
        throw new Error(`Schema validation failed: ${issues}`);
      }

      this.logToFile(composedPrompt, model, duration, { data: parsed.data });
      return parsed.data;
    } catch (e) {
      const duration = Date.now() - startTime;
      if (e instanceof Anthropic.APIConnectionTimeoutError) {
        this.log.error(`Element generation timed out | duration=${duration}ms`);
        this.logToFile(composedPrompt, model, duration, { error: `Timed out after ${duration}ms` });
        throw new ExternalServiceError('Claude API', `Timed out after ${duration}ms`);
      }
      if (e instanceof ExternalServiceError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      this.log.error(`Element generation failed | duration=${duration}ms error="${msg}"`);
      throw new ExternalServiceError('Claude API', msg);
    }
  }

  private buildSystemContent(prompt: ComposedPrompt): Anthropic.Messages.TextBlockParam[] {
    return prompt.systemBlocks.map(block => ({
      type: 'text' as const,
      text: block.content,
      cache_control: { type: 'ephemeral' as const }
    }));
  }

  private buildMessages(prompt: ComposedPrompt): Anthropic.Messages.MessageParam[] {
    const messages: Anthropic.Messages.MessageParam[] = [];

    if (prompt.profileBlocks.length > 0) {
      const content = prompt.profileBlocks.map(b => b.content).join('\n\n');
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: content, cache_control: { type: 'ephemeral' as const } }]
      });
    }

    if (prompt.sessionBlocks.length > 0) {
      const content = prompt.sessionBlocks.map(b => b.content).join('\n\n');
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: content, cache_control: { type: 'ephemeral' as const } }]
      });
    }

    if (prompt.requestBlocks.length > 0) {
      const content = prompt.requestBlocks.map(b => b.content).join('\n\n');
      messages.push({ role: 'user', content });
    }

    return messages;
  }

  private logToFile(
    prompt: ComposedPrompt,
    model: string,
    durationMs: number,
    result: { data: unknown } | { error: string; raw?: unknown }
  ): void {
    if (IS_TEST) return;
    try {
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true });
      }

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}_ResumeElement.md`;

      const systemText = prompt.systemBlocks.map(b => b.content).join('\n\n');
      const profileText = prompt.profileBlocks.map(b => b.content).join('\n\n');
      const sessionText = prompt.sessionBlocks.map(b => b.content).join('\n\n');
      const requestText = prompt.requestBlocks.map(b => b.content).join('\n\n');

      const schema = prompt.outputSchema as z.ZodObject<z.ZodRawShape>;
      const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' });

      const sections = [
        '# ResumeElementGeneration',
        `**Date:** ${now.toISOString()}`,
        `**Model:** ${model}`,
        `**Duration:** ${durationMs}ms`,
        `**Status:** ${'data' in result ? 'SUCCESS' : 'FAILURE'}`,
        '',
        '## System Prompt (SYSTEM_STABLE)',
        '',
        systemText || '*empty*',
        '',
        '## Profile Context (PROFILE_STABLE)',
        '',
        profileText || '*empty*',
        '',
        '## Session Context (SESSION_STABLE)',
        '',
        sessionText || '*empty*',
        '',
        '## Request Context (REQUEST_VARIABLE)',
        '',
        requestText || '*empty*',
        '',
        '## Output Schema',
        '',
        `\`\`\`json\n${JSON.stringify(jsonSchema, null, 2)}\n\`\`\``,
        '',
        '## Response',
        '',
        'data' in result
          ? `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``
          : `**Error:** ${result.error}${result.raw ? `\n\n**Raw response:**\n\`\`\`json\n${JSON.stringify(result.raw, null, 2)}\n\`\`\`` : ''}`
      ];

      writeFileSync(resolve(LOG_DIR, filename), sections.join('\n'), 'utf-8');
      this.log.debug(`LLM log written: ${filename}`);
    } catch {
      this.log.warn('Failed to write LLM prompt log file');
    }
  }
}
