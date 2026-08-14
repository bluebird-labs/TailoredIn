import { Inject, Injectable } from '@nestjs/common';
import {
  type EducationRepository,
  type GenerationContext,
  GenerationScope,
  ResumeContent,
  type ResumeContentRepository
} from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { ResumeElementGenerator } from '../../ports/ResumeElementGenerator.js';
import type { BulletOverride, GenerationContextBuilder } from '../../services/GenerationContextBuilder.js';
import type { PromptRegistry } from '../../services/prompt/PromptRegistry.js';

export type GenerateResumeContentScope =
  | { type: 'headline' }
  | { type: 'experience'; experienceId: string }
  | { type: 'summary'; experienceId: string }
  | { type: 'bullet'; experienceId: string; bulletIndex: number; instructions: string };

export type GenerateResumeContentInput = {
  profileId: string;
  jobDescriptionId: string;
  /** undefined = leave the stored instruction for this scope unchanged; null or '' = clear it; string = set it */
  customInstructions?: string | null;
  /** include the previous draft as a labelled prior draft (NOT as an instruction) */
  includeCurrentVersion?: boolean;
  scope?: GenerateResumeContentScope;
  bulletOverrides?: BulletOverride[];
};

type HeadlineResult = { headline: string };
type ExperienceBulletsResult = { summary: string; bullets: string[] };
type SummaryResult = { summary: string };
type BulletResult = { bullet: string };

type ScopedInstructions = Record<string, string>;

type ExperienceDraft = { summary: string; bullets: string[] };

const RESUME_SCOPE_KEY = 'resume';
const HEADLINE_SCOPE_KEY = 'headline';
const RESUME_WIDE_HEADING = '## Resume-wide direction';
const SCOPE_HEADING = '## Direction for this section (takes precedence over the resume-wide direction)';
const BULLET_HEADING = '## Direction for this bullet (takes precedence over the directions above)';

function parseScopedInstructions(prompt: string): ScopedInstructions {
  if (!prompt) return {};
  try {
    const parsed = JSON.parse(prompt);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function experienceScopeKey(experienceId: string): string {
  return `experience:${experienceId}`;
}

function buildScopeKey(scope: GenerateResumeContentScope | undefined): string {
  if (!scope) return RESUME_SCOPE_KEY;
  switch (scope.type) {
    case 'headline':
      return HEADLINE_SCOPE_KEY;
    case 'experience':
    case 'summary':
    case 'bullet':
      return experienceScopeKey(scope.experienceId);
  }
}

@Injectable()
export class GenerateResumeContent {
  public constructor(
    @Inject(DI.Resume.ContextBuilder) private readonly contextBuilder: GenerationContextBuilder,
    @Inject(DI.Resume.PromptRegistry) private readonly registry: PromptRegistry,
    @Inject(DI.Resume.ElementGenerator) private readonly elementGenerator: ResumeElementGenerator,
    @Inject(DI.ResumeContent.Repository) private readonly resumeContentRepository: ResumeContentRepository,
    @Inject(DI.Education.Repository) private readonly educationRepository: EducationRepository
  ) {}

  public async execute(input: GenerateResumeContentInput): Promise<ResumeContentDto> {
    const existing = await this.resumeContentRepository.findLatestByJobDescriptionId(input.jobDescriptionId);

    const scopeKey = buildScopeKey(input.scope);
    const merged = this.mergeInstructions(parseScopedInstructions(existing?.prompt ?? ''), scopeKey, input);
    const promptJson = JSON.stringify(merged);

    // A full generation fans out into one call per target, so its prior draft is scoped per derived context
    // in `generateFull` — never shared, to keep one experience's text out of another experience's prompt.
    const context = await this.contextBuilder.build(input.profileId, input.jobDescriptionId, {
      userInstructions: this.resolveInstructions(merged, scopeKey),
      currentVersion:
        input.scope && input.includeCurrentVersion ? this.renderCurrentVersion(existing, input.scope) : null,
      bulletOverrides: input.bulletOverrides
    });

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

    return this.generateFull(context, existing, promptJson, merged, input.includeCurrentVersion === true);
  }

  /**
   * Applies this request's steering onto the persisted scoped-instruction map.
   * `undefined` leaves the stored instruction untouched, `null`/blank clears it, anything else replaces it.
   */
  private mergeInstructions(
    previous: ScopedInstructions,
    scopeKey: string,
    input: GenerateResumeContentInput
  ): ScopedInstructions {
    const merged = { ...previous };
    if (input.customInstructions === undefined) return merged;

    const trimmed = input.customInstructions?.trim() ?? '';
    if (trimmed) {
      merged[scopeKey] = trimmed;
    } else {
      delete merged[scopeKey];
    }
    return merged;
  }

  /** Combines the resume-wide steering with the scope-specific one, most specific last. */
  private resolveInstructions(merged: ScopedInstructions, scopeKey: string): string | null {
    const resumeWide = merged[RESUME_SCOPE_KEY]?.trim() ?? '';
    const scoped = scopeKey === RESUME_SCOPE_KEY ? '' : (merged[scopeKey]?.trim() ?? '');

    const parts: string[] = [];
    if (resumeWide) parts.push(`${RESUME_WIDE_HEADING}\n${resumeWide}`);
    if (scoped) parts.push(`${SCOPE_HEADING}\n${scoped}`);
    return parts.length > 0 ? parts.join('\n\n') : null;
  }

  /**
   * Renders the previous draft of a single generation target. Never an instruction — a labelled prior draft.
   * Always scoped to one target so an experience prompt never sees another experience's text.
   */
  private renderCurrentVersion(existing: ResumeContent | null, scope: GenerateResumeContentScope): string | null {
    if (!existing) return null;

    if (scope.type === 'headline') {
      return existing.headline ? `## Headline\n${existing.headline}` : null;
    }

    const target = existing.experiences.find(e => e.experienceId === scope.experienceId);
    return target ? this.renderExperienceDraft(target) : null;
  }

  private renderExperienceDraft(experience: ExperienceDraft): string | null {
    const parts: string[] = [];
    if (experience.summary) parts.push(`Summary: ${experience.summary}`);
    if (experience.bullets.length > 0) {
      parts.push(experience.bullets.map((bullet, index) => `${index + 1}. ${bullet}`).join('\n'));
    }
    return parts.length > 0 ? parts.join('\n') : null;
  }

  private async generateFull(
    context: GenerationContext,
    existing: ResumeContent | null,
    promptJson: string,
    merged: ScopedInstructions,
    includeCurrentVersion: boolean
  ): Promise<ResumeContentDto> {
    const headlineRecipe = this.registry.getRecipe(GenerationScope.HEADLINE);
    const experienceRecipe = this.registry.getRecipe(GenerationScope.EXPERIENCE);
    const runId = new Date().toISOString().replace(/[:.]/g, '-');

    const headlineContext: GenerationContext = {
      ...context,
      userInstructions: this.resolveInstructions(merged, HEADLINE_SCOPE_KEY),
      currentVersion: includeCurrentVersion ? this.renderCurrentVersion(existing, { type: 'headline' }) : null
    };
    const headlinePromise = this.elementGenerator
      .generate(headlineRecipe.compose(headlineContext, runId))
      .then(raw => raw as HeadlineResult);

    const summaryRecipe = this.registry.getRecipe(GenerationScope.EXPERIENCE_SUMMARY);

    const experiencePromises = context.experiences.map(exp => {
      const expContext: GenerationContext = {
        ...this.withTargetExperience(context, exp.id),
        userInstructions: this.resolveInstructions(merged, experienceScopeKey(exp.id)),
        currentVersion: includeCurrentVersion
          ? this.renderCurrentVersion(existing, { type: 'experience', experienceId: exp.id })
          : null
      };
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

    const failedExperienceIds = experienceResults.filter(r => 'error' in r).map(r => r.experienceId);

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
      })),
      failedExperienceIds
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
      }),
      failedExperienceIds: []
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
      userInstructions: this.withBulletInstructions(context.userInstructions, instructions)
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

  /** The one-off bullet instruction is the most specific steering — it comes last, after the stored ones. */
  private withBulletInstructions(resolved: string | null, bulletInstructions: string): string | null {
    const trimmed = bulletInstructions.trim();
    const parts: string[] = [];
    if (resolved) parts.push(resolved);
    if (trimmed) parts.push(`${BULLET_HEADING}\n${trimmed}`);
    return parts.length > 0 ? parts.join('\n\n') : null;
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
      }),
      failedExperienceIds: []
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
