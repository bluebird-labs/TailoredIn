import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inject, injectable } from '@needle-di/core';
import type { JobDescriptionParseResult, JobDescriptionParser } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { JobLevel, LocationType } from '@tailoredin/domain';
import { z } from 'zod';
import { DI } from '../DI.js';
import type { ClaudeCliProvider } from './llm/ClaudeCliProvider.js';
import { LlmJsonRequest } from './llm/LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dir, 'prompts/parse-job-description.md');

const jobDescriptionParseSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  location: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  salaryCurrency: z.string().nullable(),
  level: z.enum(Object.values(JobLevel) as [string, ...string[]]).nullable(),
  locationType: z.enum(Object.values(LocationType) as [string, ...string[]]).nullable(),
  postedAt: z.string().nullable()
});

class JobDescriptionParseRequest extends LlmJsonRequest<typeof jobDescriptionParseSchema> {
  public readonly schema = jobDescriptionParseSchema;

  public constructor(private readonly text: string) {
    super();
  }

  public get prompt(): string {
    const template = readFileSync(PROMPT_PATH, 'utf-8');
    const levels = Object.values(JobLevel).join(', ');
    const locationTypes = Object.values(LocationType).join(', ');

    return template
      .replace('{{text}}', this.text)
      .replace('{{levels}}', levels)
      .replace('{{locationTypes}}', locationTypes);
  }
}

@injectable()
export class ClaudeCliJobDescriptionParser implements JobDescriptionParser {
  private readonly log = Logger.create(this);

  public constructor(private readonly provider: ClaudeCliProvider = inject(DI.Llm.ClaudeCliProvider)) {}

  public async parseFromText(text: string): Promise<JobDescriptionParseResult> {
    this.log.info(`Parsing job description (${text.length} chars)`);

    const startTime = Date.now();
    const result = await this.provider.request(new JobDescriptionParseRequest(text));
    const duration = Date.now() - startTime;

    if (result.isErr) {
      const exitCode = result.error.exitCode ?? 'unknown';
      this.log.error(
        `Job description parsing failed | exitCode=${exitCode} duration=${duration}ms error="${result.error.message}"`
      );
      throw new ExternalServiceError('Claude CLI', 'Job description parsing failed');
    }

    const parsed: JobDescriptionParseResult = {
      ...result.value,
      level: result.value.level as JobLevel | null,
      locationType: result.value.locationType as LocationType | null
    };

    this.log.info(`Job description parsed | title="${parsed.title}" duration=${duration}ms`);
    return parsed;
  }
}
