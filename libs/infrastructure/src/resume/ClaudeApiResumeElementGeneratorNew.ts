import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';
import { Inject, Injectable } from '@nestjs/common';
import type { ComposedPrompt, ResumeElementGenerator } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { getLogDirectory, Logger } from '@tailoredin/core';
import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from '../llm/ClaudeApiProvider.js';

const IS_TEST = process.env.NODE_ENV === 'test';

const MAX_TOKENS = 4096;
const TIMEOUT_MS = 300_000;

/** Outcome of the single repair retry, recorded in the file log. */
type RepairLog = {
  readonly issues: string;
  readonly raw: unknown;
  readonly outcome: 'succeeded' | 'failed';
};

@Injectable()
export class ClaudeApiResumeElementGenerator implements ResumeElementGenerator {
  private readonly log = Logger.create(this);

  public constructor(@Inject(DI.Llm.ClaudeApiProvider) private readonly provider: ClaudeApiProvider) {}

  public async generate(composedPrompt: ComposedPrompt): Promise<unknown> {
    const systemContent = this.buildSystemContent(composedPrompt);
    const messages = this.buildMessages(composedPrompt);
    const model = composedPrompt.model as Anthropic.Messages.Model;
    const schema = composedPrompt.outputSchema as z.ZodObject<z.ZodRawShape>;
    const { meta } = composedPrompt;

    this.log.info(`Generating element | scope=${meta.scope} model=${model} messages=${messages.length}`);
    const startTime = Date.now();

    try {
      // biome-ignore lint/suspicious/noExplicitAny: zodToJsonSchema return type doesn't match SDK's JsonSchema type
      const jsonSchema = zodToJsonSchema(schema, { target: 'jsonSchema7' }) as any;

      const client = this.provider.getClient();
      const response = await this.callModel(client, model, systemContent, messages, jsonSchema);

      const parsed = schema.safeParse(response.parsed_output);
      if (parsed.success) {
        const duration = Date.now() - startTime;
        this.log.info(`Element generated | scope=${meta.scope} duration=${duration}ms`);
        this.logToFile(composedPrompt, model, duration, { data: parsed.data });
        return parsed.data;
      }

      // One repair retry: feed the violations back and ask for a corrected object.
      const firstIssues = this.formatIssues(parsed.error.issues);
      this.log.warn(`Schema validation failed, issuing repair retry | scope=${meta.scope} issues="${firstIssues}"`);

      const repairMessages: Anthropic.Messages.MessageParam[] = [
        ...messages,
        { role: 'user', content: this.buildRepairMessage(parsed.error.issues, response.parsed_output) }
      ];
      const repairResponse = await this.callModel(client, model, systemContent, repairMessages, jsonSchema);

      const repaired = schema.safeParse(repairResponse.parsed_output);
      const duration = Date.now() - startTime;

      if (repaired.success) {
        this.log.info(`Element generated after repair retry | scope=${meta.scope} duration=${duration}ms`);
        this.logToFile(
          composedPrompt,
          model,
          duration,
          { data: repaired.data },
          { issues: firstIssues, raw: response.parsed_output, outcome: 'succeeded' }
        );
        return repaired.data;
      }

      const repairIssues = this.formatIssues(repaired.error.issues);
      const failure = `Schema validation failed after repair retry: ${repairIssues}`;
      this.logToFile(
        composedPrompt,
        model,
        duration,
        { error: failure, raw: repairResponse.parsed_output },
        { issues: firstIssues, raw: response.parsed_output, outcome: 'failed' }
      );
      throw new Error(failure);
    } catch (e) {
      const duration = Date.now() - startTime;
      if (e instanceof Anthropic.APIConnectionTimeoutError) {
        this.log.error(`Element generation timed out | scope=${meta.scope} duration=${duration}ms`);
        this.logToFile(composedPrompt, model, duration, { error: `Timed out after ${duration}ms` });
        throw new ExternalServiceError('Claude API', `Timed out after ${duration}ms`);
      }
      if (e instanceof ExternalServiceError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      this.log.error(`Element generation failed | scope=${meta.scope} duration=${duration}ms error="${msg}"`);
      throw new ExternalServiceError('Claude API', msg);
    }
  }

  private async callModel(
    client: Anthropic,
    model: Anthropic.Messages.Model,
    system: Anthropic.Messages.TextBlockParam[],
    messages: Anthropic.Messages.MessageParam[],
    // biome-ignore lint/suspicious/noExplicitAny: zodToJsonSchema return type doesn't match SDK's JsonSchema type
    jsonSchema: any
  ): Promise<{ parsed_output: unknown }> {
    const response = await client.messages.parse(
      {
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages,
        output_config: { format: jsonSchemaOutputFormat(jsonSchema) }
      },
      { timeout: TIMEOUT_MS }
    );
    return { parsed_output: response.parsed_output };
  }

  private formatIssues(issues: readonly z.ZodIssue[]): string {
    return issues.map(i => `${this.pathOf(i)}: ${i.message}`).join('; ');
  }

  /**
   * Builds the repair message: the rejected output, then one line per violated field naming what is
   * wrong with the actual value and the hard limit it must respect.
   */
  private buildRepairMessage(issues: readonly z.ZodIssue[], raw: unknown): string {
    const violations = issues.map(issue => this.describeIssue(issue, raw));

    return [
      '## Correction Required',
      '',
      'Your previous response was REJECTED because it violated the hard output limits. Produce a corrected version.',
      '',
      'Rejected response:',
      '```json',
      JSON.stringify(raw, null, 2),
      '```',
      '',
      'Violations to fix:',
      ...violations,
      '',
      'Return ONLY a corrected JSON object matching the same schema. Keep the fields that were within their limits as they are, and rewrite the fields listed above so every one of them lands inside its limit. Do not invent facts to pad a field, and do not drop a required metric to shorten one. All other instructions above - especially the user instructions - still apply.'
    ].join('\n');
  }

  private describeIssue(issue: z.ZodIssue, raw: unknown): string {
    const path = this.pathOf(issue);
    const actual = this.describeValue(this.valueAtPath(raw, issue.path));

    if (issue.code === 'too_big') {
      const bound = issue.inclusive ? 'at most' : 'fewer than';
      const unit = this.unitFor(issue.type);
      return `- ${path}: ${actual}, but the hard limit is ${bound} ${issue.maximum} ${unit}. Rewrite it shorter while keeping its meaning.`;
    }
    if (issue.code === 'too_small') {
      const bound = issue.inclusive ? 'at least' : 'more than';
      const unit = this.unitFor(issue.type);
      return `- ${path}: ${actual}, but the hard limit is ${bound} ${issue.minimum} ${unit}. Expand it using detail already present in the source data.`;
    }
    return `- ${path}: ${actual}. ${issue.message}`;
  }

  private pathOf(issue: z.ZodIssue): string {
    return issue.path.length > 0 ? issue.path.join('.') : '(root)';
  }

  private unitFor(type: string): string {
    if (type === 'string') return 'characters';
    if (type === 'array') return 'items';
    return type;
  }

  private describeValue(value: unknown): string {
    if (typeof value === 'string') return `the value is ${value.length} characters`;
    if (Array.isArray(value)) return `the value has ${value.length} items`;
    if (value === undefined) return 'the value is missing';
    if (value === null) return 'the value is null';
    return `the value is a ${typeof value}`;
  }

  private valueAtPath(raw: unknown, path: readonly (string | number)[]): unknown {
    let current: unknown = raw;
    for (const segment of path) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string | number, unknown>)[segment];
    }
    return current;
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
    result: { data: unknown } | { error: string; raw?: unknown },
    repair?: RepairLog
  ): void {
    if (IS_TEST) return;
    try {
      const { meta } = prompt;
      const now = new Date();

      const folderName = `${meta.generationRunId}-${meta.profileId.slice(0, 8)}-${meta.jobDescriptionId.slice(0, 8)}`;
      const folderPath = getLogDirectory('llm', folderName);

      const filename = meta.experienceId ? `${meta.scope}-${meta.experienceId}.md` : `${meta.scope}.md`;

      const systemText = prompt.systemBlocks.map(b => b.content).join('\n\n');
      const profileText = prompt.profileBlocks.map(b => b.content).join('\n\n');
      const sessionText = prompt.sessionBlocks.map(b => b.content).join('\n\n');
      const requestText = prompt.requestBlocks.map(b => b.content).join('\n\n');

      const schema = prompt.outputSchema as z.ZodObject<z.ZodRawShape>;
      const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' });

      const metaLines = [
        `**Scope:** ${meta.scope}`,
        `**Profile ID:** ${meta.profileId}`,
        `**Job Description ID:** ${meta.jobDescriptionId}`
      ];
      if (meta.experienceId) {
        metaLines.push(`**Experience ID:** ${meta.experienceId}`);
      }
      metaLines.push(`**Repair retry:** ${repair ? repair.outcome : 'not needed'}`);

      const repairSection = repair
        ? [
            '## Repair Retry',
            '',
            `First attempt failed schema validation and a single repair retry was issued (${repair.outcome}).`,
            '',
            `**First attempt issues:** ${repair.issues}`,
            '',
            '**First attempt raw response:**',
            `\`\`\`json\n${JSON.stringify(repair.raw, null, 2)}\n\`\`\``,
            ''
          ]
        : [];

      const sections = [
        `# ${meta.scope}${meta.experienceId ? ` — ${meta.experienceId}` : ''}`,
        `**Date:** ${now.toISOString()}`,
        `**Model:** ${model}`,
        `**Duration:** ${durationMs}ms`,
        `**Status:** ${'data' in result ? 'SUCCESS' : 'FAILURE'}`,
        ...metaLines,
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
        ...repairSection,
        '## Response',
        '',
        'data' in result
          ? `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``
          : `**Error:** ${result.error}${result.raw ? `\n\n**Raw response:**\n\`\`\`json\n${JSON.stringify(result.raw, null, 2)}\n\`\`\`` : ''}`
      ];

      writeFileSync(resolve(folderPath, filename), sections.join('\n'), 'utf-8');
      this.log.debug(`LLM log written: ${folderName}/${filename}`);
    } catch {
      this.log.warn('Failed to write LLM prompt log file');
    }
  }
}
