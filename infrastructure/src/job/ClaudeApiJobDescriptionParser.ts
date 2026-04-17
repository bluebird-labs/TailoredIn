import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import type { JobDescriptionParseResult, JobDescriptionParser } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { JobLevel, LocationType } from '@tailoredin/domain';
import { z } from 'zod';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from '../llm/ClaudeApiProvider.js';
import { LlmJsonRequest } from '../llm/LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dirname, 'prompts/parse-job-description.md');

const jobDescriptionParseSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  location: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  salaryCurrency: z.string().nullable(),
  level: z.nativeEnum(JobLevel).nullable(),
  locationType: z.nativeEnum(LocationType).nullable(),
  postedAt: z.string().nullable(),
  soughtHardSkills: z.array(z.string()).nullable(),
  soughtSoftSkills: z.array(z.string()).nullable()
});

class JobDescriptionParseRequest extends LlmJsonRequest<typeof jobDescriptionParseSchema> {
  public readonly schema = jobDescriptionParseSchema;

  public constructor(private readonly text: string) {
    super();
  }

  public getInput(): Record<string, unknown> {
    return { text: this.text };
  }

  public get prompt(): string {
    const template = readFileSync(PROMPT_PATH, 'utf-8');
    return template.replace('{{text}}', this.text) + this.buildValidationErrorsSuffix();
  }
}

@Injectable()
export class ClaudeApiJobDescriptionParser implements JobDescriptionParser {
  private readonly log = Logger.create(this);

  public constructor(@Inject(DI.Llm.ClaudeApiProvider) private readonly provider: ClaudeApiProvider) {}

  public async parseFromText(text: string): Promise<JobDescriptionParseResult> {
    this.log.info(`Parsing job description (${text.length} chars)`);

    const startTime = Date.now();
    const result = await this.provider.request(new JobDescriptionParseRequest(text));
    const duration = Date.now() - startTime;

    if (result.isErr) {
      this.log.error(`Job description parsing failed | duration=${duration}ms error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', `Job description parsing failed: ${result.error.message}`);
    }

    this.log.info(`Job description parsed | title="${result.value.title}" duration=${duration}ms`);
    return result.value;
  }
}
