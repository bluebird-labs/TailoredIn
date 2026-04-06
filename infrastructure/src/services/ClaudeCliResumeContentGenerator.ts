import { inject, injectable } from '@needle-di/core';
import type { ResumeContentGenerator, ResumeContentGeneratorInput, ResumeContentGeneratorResult } from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { DI } from '../DI.js';
import type { ClaudeCliProvider } from './llm/ClaudeCliProvider.js';
import { GenerateResumeBulletsRequest } from './llm/GenerateResumeBulletsRequest.js';

@injectable()
export class ClaudeCliResumeContentGenerator implements ResumeContentGenerator {
  private readonly log = Logger.create(this);

  public constructor(private readonly provider: ClaudeCliProvider = inject(DI.Llm.ClaudeCliProvider)) {}

  public async generate(input: ResumeContentGeneratorInput): Promise<ResumeContentGeneratorResult> {
    this.log.info(`Generating resume bullets for ${input.experiences.length} experience(s)`);

    const startTime = Date.now();
    const result = await this.provider.request(new GenerateResumeBulletsRequest(input));
    const duration = Date.now() - startTime;

    if (result.isErr) {
      const exitCode = result.error.exitCode ?? 'unknown';
      this.log.error(
        `Resume content generation failed | exitCode=${exitCode} duration=${duration}ms error="${result.error.message}"`
      );
      throw new ExternalServiceError('Claude CLI', 'Resume content generation failed');
    }

    const experiences = result.value.experiences.flatMap(llmExp => {
      const inputExp = input.experiences.find(e => e.id === llmExp.experienceId);
      if (!inputExp) {
        return [];
      }
      return [
        {
          experienceId: llmExp.experienceId,
          experienceTitle: inputExp.title,
          companyName: inputExp.companyName,
          bullets: llmExp.bullets
        }
      ];
    });

    this.log.info(`Resume bullets generated | experiences=${experiences.length} duration=${duration}ms`);

    return { experiences };
  }
}
