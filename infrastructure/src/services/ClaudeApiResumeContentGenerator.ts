import type Anthropic from '@anthropic-ai/sdk';
import { inject, injectable } from '@needle-di/core';
import type {
  ResumeContentGenerator,
  ResumeContentGeneratorInput,
  ResumeContentGeneratorResult
} from '@tailoredin/application';
import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { ModelTier } from '@tailoredin/domain';
import { DI } from '../DI.js';
import type { ClaudeApiProvider } from './llm/ClaudeApiProvider.js';
import { GenerateResumeBulletsRequest } from './llm/GenerateResumeBulletsRequest.js';
import { RegenerateExperienceRequest } from './llm/RegenerateExperienceRequest.js';
import { RegenerateHeadlineRequest } from './llm/RegenerateHeadlineRequest.js';

const MODEL_TIER_MAP: Record<ModelTier, Anthropic.Messages.Model> = {
  [ModelTier.FAST]: 'claude-haiku-4-5',
  [ModelTier.BALANCED]: 'claude-sonnet-4-6',
  [ModelTier.BEST]: 'claude-opus-4-6'
};

@injectable()
export class ClaudeApiResumeContentGenerator implements ResumeContentGenerator {
  private readonly log = Logger.create(this);

  public constructor(private readonly provider: ClaudeApiProvider = inject(DI.Llm.ClaudeApiProvider)) {}

  public async generate(input: ResumeContentGeneratorInput): Promise<ResumeContentGeneratorResult> {
    const model = this.resolveModel(input.model);

    if (input.scope?.type === 'headline') {
      return this.generateHeadline(input, model);
    }
    if (input.scope?.type === 'experience') {
      return this.generateExperience(input, input.scope.experienceId, model);
    }
    return this.generateFull(input, model);
  }

  private resolveModel(model?: string): Anthropic.Messages.Model {
    if (!model) return 'claude-opus-4-6';
    // The use case already resolves ModelTier → model ID, so check both:
    // 1. If it's a tier name (e.g. 'fast'), map it to a model ID
    // 2. If it's already a model ID (e.g. 'claude-haiku-4-5'), use it directly
    return MODEL_TIER_MAP[model as ModelTier] ?? (model as Anthropic.Messages.Model);
  }

  private async generateFull(
    input: ResumeContentGeneratorInput,
    model: Anthropic.Messages.Model
  ): Promise<ResumeContentGeneratorResult> {
    this.log.info(`Generating resume bullets for ${input.experiences.length} experience(s)`);

    const startTime = Date.now();
    const request = new GenerateResumeBulletsRequest(input, model);
    const result = await this.provider.request(request, { timeoutMs: 300_000 });
    const duration = Date.now() - startTime;

    if (result.isErr) {
      this.log.error(`Resume content generation failed | duration=${duration}ms error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', result.error.message);
    }

    const requestSchema = request.getJsonSchema();
    const experiences = this.mapExperiences(result.value.experiences, input);

    this.log.info(`Resume bullets generated | experiences=${experiences.length} duration=${duration}ms`);

    return { headline: result.value.headline, experiences, requestPrompt: request.prompt, requestSchema };
  }

  private async generateHeadline(
    input: ResumeContentGeneratorInput,
    model: Anthropic.Messages.Model
  ): Promise<ResumeContentGeneratorResult> {
    this.log.info('Regenerating headline only');

    const startTime = Date.now();
    const request = new RegenerateHeadlineRequest(input, model);
    const result = await this.provider.request(request, { timeoutMs: 300_000 });
    const duration = Date.now() - startTime;

    if (result.isErr) {
      this.log.error(`Headline regeneration failed | duration=${duration}ms error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', result.error.message);
    }

    this.log.info(`Headline regenerated | duration=${duration}ms`);

    return {
      headline: result.value.headline,
      experiences: [],
      requestPrompt: request.prompt,
      requestSchema: request.getJsonSchema()
    };
  }

  private async generateExperience(
    input: ResumeContentGeneratorInput,
    experienceId: string,
    model: Anthropic.Messages.Model
  ): Promise<ResumeContentGeneratorResult> {
    this.log.info(`Regenerating experience="${experienceId}"`);

    const startTime = Date.now();
    const request = new RegenerateExperienceRequest(input, experienceId, model);
    const result = await this.provider.request(request, { timeoutMs: 300_000 });
    const duration = Date.now() - startTime;

    if (result.isErr) {
      this.log.error(`Experience regeneration failed | duration=${duration}ms error="${result.error.message}"`);
      throw new ExternalServiceError('Claude API', result.error.message);
    }

    const experiences = this.mapExperiences(result.value.experiences, input);

    this.log.info(`Experience regenerated | experienceId="${experienceId}" duration=${duration}ms`);

    return { headline: '', experiences, requestPrompt: request.prompt, requestSchema: request.getJsonSchema() };
  }

  private mapExperiences(
    llmExperiences: Array<{ experienceId: string; summary: string; bullets: string[] }>,
    input: ResumeContentGeneratorInput
  ) {
    return llmExperiences.flatMap(llmExp => {
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
  }
}
