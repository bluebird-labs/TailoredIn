import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import type { ResumeScoreInput, ResumeScorer } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import type { ResumeScore } from '@tailoredin/domain';
import { z } from 'zod';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from '../llm/ClaudeApiProvider.js';
import { LlmJsonRequest } from '../llm/LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dir, 'prompts/score-resume.md');

const resumeScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  requirements: z.array(
    z.object({
      requirement: z.string(),
      coverage: z.enum(['strong', 'partial', 'absent']),
      matchingBulletIndices: z.array(z.number()),
      reasoning: z.string()
    })
  ),
  summary: z.string()
});

class ResumeScoreRequest extends LlmJsonRequest<typeof resumeScoreSchema> {
  public readonly schema = resumeScoreSchema;

  public constructor(private readonly input: ResumeScoreInput) {
    super();
  }

  public override get model(): string {
    return 'claude-haiku-4-5-20251001';
  }

  public override get maxTokens(): number {
    return 4096;
  }

  public getInput(): Record<string, unknown> {
    return {
      jobDescriptionLength: this.input.jobDescriptionText.length,
      resumeMarkdownLength: this.input.resumeMarkdown.length
    };
  }

  public get prompt(): string {
    const template = readFileSync(PROMPT_PATH, 'utf-8');
    return (
      template
        .replace('{{jobDescription}}', this.input.jobDescriptionText)
        .replace('{{resumeContent}}', this.input.resumeMarkdown) + this.buildValidationErrorsSuffix()
    );
  }
}

@Injectable()
export class ClaudeApiResumeScorer implements ResumeScorer {
  private readonly log = Logger.create(this);

  public constructor(@Inject(DI.Llm.ClaudeApiProvider) private readonly provider: ClaudeApiProvider) {}

  public async score(input: ResumeScoreInput): Promise<ResumeScore> {
    this.log.info(
      `Scoring resume | jd=${input.jobDescriptionText.length}chars resume=${input.resumeMarkdown.length}chars`
    );

    const startTime = Date.now();
    const result = await this.provider.request(new ResumeScoreRequest(input), {
      timeoutMs: 90_000,
      maxRetries: 2
    });
    const duration = Date.now() - startTime;

    if (result.isErr) {
      this.log.error(`Resume scoring failed | duration=${duration}ms error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', `Resume scoring failed: ${result.error.message}`);
    }

    this.log.info(`Resume scored | overall=${result.value.overall} duration=${duration}ms`);
    return result.value;
  }
}
