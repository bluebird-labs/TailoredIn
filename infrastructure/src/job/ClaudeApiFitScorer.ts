import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import type { FitScoreInput, FitScoreResult, FitScorer } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { z } from 'zod';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from '../llm/ClaudeApiProvider.js';
import { LlmJsonRequest } from '../llm/LlmJsonRequest.js';

const PROMPT_PATH = resolve(import.meta.dir, 'prompts/score-fit.md');

const fitScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  requirements: z.array(
    z.object({
      requirement: z.string(),
      coverage: z.enum(['strong', 'partial', 'not_evidenced', 'absent']),
      reasoning: z.string()
    })
  ),
  summary: z.string()
});

class FitScoreRequest extends LlmJsonRequest<typeof fitScoreSchema> {
  public readonly schema = fitScoreSchema;

  public constructor(private readonly input: FitScoreInput) {
    super();
  }

  public override get model(): string {
    return 'claude-opus-4-6';
  }

  public override get maxTokens(): number {
    return 16384;
  }

  public getInput(): Record<string, unknown> {
    return {
      jobDescriptionLength: this.input.jobDescriptionText.length,
      profileMarkdownLength: this.input.profileMarkdown.length
    };
  }

  public get prompt(): string {
    const template = readFileSync(PROMPT_PATH, 'utf-8');
    return (
      template
        .replace('{{jobDescription}}', this.input.jobDescriptionText)
        .replace('{{profileContent}}', this.input.profileMarkdown) + this.buildValidationErrorsSuffix()
    );
  }
}

@Injectable()
export class ClaudeApiFitScorer implements FitScorer {
  private readonly log = Logger.create(this);

  public constructor(@Inject(DI.Llm.ClaudeApiProvider) private readonly provider: ClaudeApiProvider) {}

  public async score(input: FitScoreInput): Promise<FitScoreResult> {
    this.log.info(
      `Scoring job fit | jd=${input.jobDescriptionText.length}chars profile=${input.profileMarkdown.length}chars`
    );

    const startTime = Date.now();
    const result = await this.provider.request(new FitScoreRequest(input), {
      timeoutMs: 90_000,
      maxRetries: 2
    });
    const duration = Date.now() - startTime;

    if (result.isErr) {
      this.log.error(`Job fit scoring failed | duration=${duration}ms error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', `Job fit scoring failed: ${result.error.message}`);
    }

    this.log.info(`Job fit scored | overall=${result.value.overall} duration=${duration}ms`);
    return result.value;
  }
}
