import {
  type EducationRepository,
  type GenerationContext,
  GenerationScope,
  ResumeContent,
  type ResumeContentRepository
} from '@tailoredin/domain';
import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { ResumeElementGenerator } from '../../ports/ResumeElementGenerator.js';
import type { GenerationContextBuilder } from '../../services/GenerationContextBuilder.js';
import type { PromptRegistry } from '../../services/prompt/PromptRegistry.js';

export type GenerateResumeContentScope =
  | { type: 'headline' }
  | { type: 'experience'; experienceId: string }
  | { type: 'summary'; experienceId: string }
  | { type: 'bullet'; experienceId: string; bulletIndex: number; instructions: string };

export type GenerateResumeContentInput = {
  jobDescriptionId: string;
  additionalPrompt?: string;
  scope?: GenerateResumeContentScope;
};

type HeadlineResult = { headline: string };
type ExperienceBulletsResult = { summary: string; bullets: string[] };
type SummaryResult = { summary: string };
type BulletResult = { bullet: string };

type ScopedInstructions = Record<string, string>;

function parseScopedInstructions(prompt: string): ScopedInstructions {
  if (!prompt) return {};
  try {
    const parsed = JSON.parse(prompt);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    // Legacy format — treat as resume-level instructions
    return { resume: prompt };
  }
}

function buildScopeKey(scope: GenerateResumeContentScope | undefined): string {
  if (!scope) return 'resume';
  switch (scope.type) {
    case 'headline':
      return 'headline';
    case 'experience':
    case 'summary':
    case 'bullet':
      return `experience:${scope.experienceId}`;
  }
}

export class GenerateResumeContent {
  public constructor(
    private readonly contextBuilder: GenerationContextBuilder,
    private readonly registry: PromptRegistry,
    private readonly elementGenerator: ResumeElementGenerator,
    private readonly resumeContentRepository: ResumeContentRepository,
    private readonly educationRepository: EducationRepository
  ) {}

  public async execute(input: GenerateResumeContentInput): Promise<ResumeContentDto> {
    const context = await this.contextBuilder.build(input.jobDescriptionId, input.additionalPrompt);
    const existing = await this.resumeContentRepository.findLatestByJobDescriptionId(input.jobDescriptionId);

    const previousInstructions = parseScopedInstructions(existing?.prompt ?? '');
    const scopeKey = buildScopeKey(input.scope);
    const scopedInstructions = { ...previousInstructions };
    if (input.additionalPrompt) {
      scopedInstructions[scopeKey] = input.additionalPrompt;
    } else {
      delete scopedInstructions[scopeKey];
    }
    const promptJson = JSON.stringify(scopedInstructions);

    if (input.scope?.type === 'headline') {
      return this.generateHeadline(context, existing, promptJson);
    }
    if (input.scope?.type === 'experience') {
      return this.generateExperience(context, input.scope.experienceId, existing, promptJson);
    }
    if (input.scope?.type === 'summary') {
      return this.generateSummary(context, input.scope.experienceId, existing, promptJson);
    }
    if (input.scope?.type === 'bullet') {
      return this.generateBullet(
        context,
        input.scope.experienceId,
        input.scope.bulletIndex,
        input.scope.instructions,
        existing,
        promptJson
      );
    }

    return this.generateFull(context, existing, promptJson);
  }

  private async generateFull(
    context: GenerationContext,
    existing: ResumeContent | null,
    promptJson: string
  ): Promise<ResumeContentDto> {
    const headlineRecipe = this.registry.getRecipe(GenerationScope.HEADLINE);
    const experienceRecipe = this.registry.getRecipe(GenerationScope.EXPERIENCE);
    const runId = new Date().toISOString().replace(/[:.]/g, '-');

    const headlinePromise = this.elementGenerator
      .generate(headlineRecipe.compose(context, runId))
      .then(raw => raw as HeadlineResult);

    const summaryRecipe = this.registry.getRecipe(GenerationScope.EXPERIENCE_SUMMARY);

    const experiencePromises = context.experiences.map(exp => {
      const expContext = this.withTargetExperience(context, exp.id);
      if (exp.bulletMax === 0) {
        return this.elementGenerator
          .generate(summaryRecipe.compose(expContext, runId))
          .then(raw => ({
            experienceId: exp.id,
            result: { ...(raw as SummaryResult), bullets: [] } as ExperienceBulletsResult
          }))
          .catch(error => ({
            experienceId: exp.id,
            error: error instanceof Error ? error.message : String(error)
          }));
      }
      return this.elementGenerator
        .generate(experienceRecipe.compose(expContext, runId))
        .then(raw => ({ experienceId: exp.id, result: raw as ExperienceBulletsResult }))
        .catch(error => ({
          experienceId: exp.id,
          error: error instanceof Error ? error.message : String(error)
        }));
    });

    const [headlineResult, ...experienceResults] = await Promise.all([headlinePromise, ...experiencePromises]);

    const experiences = experienceResults.map(r => {
      if ('error' in r) {
        const existingExp = existing?.experiences.find(e => e.experienceId === r.experienceId);
        const exp = context.experiences.find(e => e.id === r.experienceId)!;
        return {
          experienceId: r.experienceId,
          experienceTitle: exp.title,
          companyName: exp.companyName,
          summary: existingExp?.summary ?? '',
          bullets: existingExp?.bullets ?? [],
          hiddenBulletIndices: existingExp?.hiddenBulletIndices ?? []
        };
      }
      const exp = context.experiences.find(e => e.id === r.experienceId)!;
      return {
        experienceId: r.experienceId,
        experienceTitle: exp.title,
        companyName: exp.companyName,
        summary: r.result.summary,
        bullets: r.result.bullets,
        hiddenBulletIndices: []
      };
    });

    const hiddenEducationIds = existing ? existing.hiddenEducationIds : await this.resolveDefaultHiddenEducationIds();

    const resumeContent = ResumeContent.create({
      profileId: context.profile.id,
      jobDescriptionId: context.jobDescription.id,
      headline: headlineResult.headline,
      experiences: experiences.map(e => ({
        experienceId: e.experienceId,
        summary: e.summary,
        bullets: e.bullets,
        hiddenBulletIndices: e.hiddenBulletIndices
      })),
      hiddenEducationIds,
      prompt: promptJson,
      schema: null
    });
    await this.resumeContentRepository.save(resumeContent);

    return {
      headline: headlineResult.headline,
      experiences: experiences.map(e => ({
        experienceId: e.experienceId,
        experienceTitle: e.experienceTitle,
        companyName: e.companyName,
        bullets: e.bullets
      }))
    };
  }

  private async generateHeadline(
    context: GenerationContext,
    existing: ResumeContent | null,
    promptJson: string
  ): Promise<ResumeContentDto> {
    const recipe = this.registry.getRecipe(GenerationScope.HEADLINE);
    const raw = await this.elementGenerator.generate(recipe.compose(context));
    const result = raw as HeadlineResult;

    const experiences = existing
      ? existing.experiences
      : context.experiences.map(e => ({
          experienceId: e.id,
          summary: '',
          bullets: [] as string[],
          hiddenBulletIndices: [] as number[]
        }));

    const hiddenEducationIds = existing?.hiddenEducationIds ?? (await this.resolveDefaultHiddenEducationIds());

    const resumeContent = ResumeContent.create({
      profileId: context.profile.id,
      jobDescriptionId: context.jobDescription.id,
      headline: result.headline,
      experiences,
      hiddenEducationIds,
      prompt: promptJson,
      schema: null
    });
    await this.resumeContentRepository.save(resumeContent);

    return {
      headline: result.headline,
      experiences: experiences.map(e => {
        const exp = context.experiences.find(x => x.id === e.experienceId);
        return {
          experienceId: e.experienceId,
          experienceTitle: exp?.title ?? '',
          companyName: exp?.companyName ?? '',
          bullets: e.bullets
        };
      })
    };
  }

  private async generateExperience(
    context: GenerationContext,
    experienceId: string,
    existing: ResumeContent | null,
    promptJson: string
  ): Promise<ResumeContentDto> {
    const recipe = this.registry.getRecipe(GenerationScope.EXPERIENCE);
    const expContext = this.withTargetExperience(context, experienceId);
    const raw = await this.elementGenerator.generate(recipe.compose(expContext));
    const result = raw as ExperienceBulletsResult;

    return this.mergeExperienceResult(context, existing, experienceId, result, promptJson);
  }

  private async generateSummary(
    context: GenerationContext,
    experienceId: string,
    existing: ResumeContent | null,
    promptJson: string
  ): Promise<ResumeContentDto> {
    const recipe = this.registry.getRecipe(GenerationScope.EXPERIENCE_SUMMARY);
    const expContext = this.withTargetExperience(context, experienceId);
    const raw = await this.elementGenerator.generate(recipe.compose(expContext));
    const result = raw as SummaryResult;

    const existingExp = existing?.experiences.find(e => e.experienceId === experienceId);
    return this.mergeExperienceResult(
      context,
      existing,
      experienceId,
      {
        summary: result.summary,
        bullets: existingExp?.bullets ?? []
      },
      promptJson
    );
  }

  private async generateBullet(
    context: GenerationContext,
    experienceId: string,
    bulletIndex: number,
    instructions: string,
    existing: ResumeContent | null,
    promptJson: string
  ): Promise<ResumeContentDto> {
    const recipe = this.registry.getRecipe(GenerationScope.BULLET);
    const existingExp = existing?.experiences.find(e => e.experienceId === experienceId);
    const existingBullets = existingExp?.bullets ?? [];

    const bulletContext: GenerationContext = {
      ...this.withTargetExperience(context, experienceId),
      userInstructions: instructions
    };

    const raw = await this.elementGenerator.generate(recipe.compose(bulletContext));
    const result = raw as BulletResult;

    const updatedBullets = [...existingBullets];
    if (bulletIndex < updatedBullets.length) {
      updatedBullets[bulletIndex] = result.bullet;
    } else {
      updatedBullets.push(result.bullet);
    }

    return this.mergeExperienceResult(
      context,
      existing,
      experienceId,
      {
        summary: existingExp?.summary ?? '',
        bullets: updatedBullets
      },
      promptJson
    );
  }

  private async mergeExperienceResult(
    context: GenerationContext,
    existing: ResumeContent | null,
    experienceId: string,
    result: { summary: string; bullets: string[] },
    promptJson: string
  ): Promise<ResumeContentDto> {
    const headline = existing?.headline ?? '';

    const experiences = existing
      ? existing.experiences.map(e =>
          e.experienceId === experienceId
            ? {
                ...e,
                summary: result.summary,
                bullets: result.bullets,
                hiddenBulletIndices: this.resolveHiddenIndices(result.bullets, e)
              }
            : e
        )
      : context.experiences.map(e =>
          e.id === experienceId
            ? { experienceId: e.id, summary: result.summary, bullets: result.bullets, hiddenBulletIndices: [] }
            : { experienceId: e.id, summary: '', bullets: [], hiddenBulletIndices: [] }
        );

    const hiddenEducationIds = existing?.hiddenEducationIds ?? (await this.resolveDefaultHiddenEducationIds());

    const resumeContent = ResumeContent.create({
      profileId: context.profile.id,
      jobDescriptionId: context.jobDescription.id,
      headline,
      experiences,
      hiddenEducationIds,
      prompt: promptJson,
      schema: null
    });
    await this.resumeContentRepository.save(resumeContent);

    return {
      headline,
      experiences: experiences.map(e => {
        const exp = context.experiences.find(x => x.id === e.experienceId);
        return {
          experienceId: e.experienceId,
          experienceTitle: exp?.title ?? '',
          companyName: exp?.companyName ?? '',
          bullets: e.bullets
        };
      })
    };
  }

  private withTargetExperience(context: GenerationContext, experienceId: string): GenerationContext {
    const target = context.experiences.find(e => e.id === experienceId);
    if (!target) throw new Error(`Experience not found: ${experienceId}`);
    return {
      ...context,
      experiences: [target, ...context.experiences.filter(e => e.id !== experienceId)]
    };
  }

  private resolveHiddenIndices(
    newBullets: string[],
    existing: { bullets: string[]; hiddenBulletIndices: number[] }
  ): number[] {
    if (existing.hiddenBulletIndices.length === 0) return [];
    return existing.hiddenBulletIndices.filter(
      i => i < newBullets.length && i < existing.bullets.length && newBullets[i] === existing.bullets[i]
    );
  }

  private async resolveDefaultHiddenEducationIds(): Promise<string[]> {
    const allEducation = await this.educationRepository.findAll();
    return allEducation.filter(e => e.hiddenByDefault).map(e => e.id);
  }
}
