import { inject, injectable } from '@needle-di/core';
import type {
  ResumeContentGenerator,
  ResumeContentGeneratorInput,
  ResumeContentGeneratorResult
} from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from './llm/ClaudeApiProvider.js';
import { GenerateResumeBulletsRequest } from './llm/GenerateResumeBulletsRequest.js';

@injectable()
export class ClaudeApiResumeContentGenerator implements ResumeContentGenerator {
  private readonly log = Logger.create(this);

  public constructor(private readonly provider: ClaudeApiProvider = inject(DI.Llm.ClaudeApiProvider)) {}

  public async generate(input: ResumeContentGeneratorInput): Promise<ResumeContentGeneratorResult> {
    this.log.info(`Generating resume bullets for ${input.experiences.length} experience(s)`);

    const startTime = Date.now();
    const request = new GenerateResumeBulletsRequest(input);
    const result = await this.provider.request(request, { timeoutMs: 300_000 });
    const duration = Date.now() - startTime;

    if (result.isErr) {
      this.log.error(`Resume content generation failed | duration=${duration}ms error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', result.error.message);
    }

    const requestSchema = JSON.parse(request.getJsonSchema()) as Record<string, unknown>;

    const experiences = result.value.experiences.flatMap(llmExp => {
      const inputExp = input.experiences.find(e => e.id === llmExp.experienceId);
      if (!inputExp) {
        this.log.warn(`LLM returned unknown experienceId="${llmExp.experienceId}" — skipping`);
        return [];
      }
      const summary = llmExp.summary.endsWith('.') ? llmExp.summary : `${llmExp.summary}.`;
      return [
        {
          experienceId: llmExp.experienceId,
          experienceTitle: inputExp.title,
          companyName: inputExp.companyName,
          summary,
          bullets: llmExp.bullets.map(b => b.replaceAll('—', '-'))
        }
      ];
    });

    this.log.info(`Resume bullets generated | experiences=${experiences.length} duration=${duration}ms`);

    return { experiences, requestSchema };
  }
}
