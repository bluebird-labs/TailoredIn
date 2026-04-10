import {
  type EducationRepository,
  EntityNotFoundError,
  type ExperienceGenerationOverrideRepository,
  type ExperienceRepository,
  GenerationScope,
  GenerationSettings,
  type GenerationSettingsRepository,
  type JobDescriptionRepository,
  ModelTier,
  type ProfileRepository,
  ResumeContent,
  type ResumeContentRepository
} from '@tailoredin/domain';
import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { ResumeContentGenerator } from '../../ports/ResumeContentGenerator.js';

export type GenerateResumeContentScope = { type: 'headline' } | { type: 'experience'; experienceId: string };

export type GenerateResumeContentInput = {
  jobDescriptionId: string;
  additionalPrompt?: string;
  scope?: GenerateResumeContentScope;
};

function resolveModelId(tier: ModelTier): string {
  switch (tier) {
    case ModelTier.FAST:
      return 'claude-haiku-4-5';
    case ModelTier.BALANCED:
      return 'claude-sonnet-4-6';
    case ModelTier.BEST:
      return 'claude-opus-4-6';
  }
}

export class GenerateResumeContent {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly jobDescriptionRepository: JobDescriptionRepository,
    private readonly resumeContentRepository: ResumeContentRepository,
    private readonly generator: ResumeContentGenerator,
    private readonly educationRepository: EducationRepository,
    private readonly generationSettingsRepository: GenerationSettingsRepository,
    private readonly experienceGenerationOverrideRepository: ExperienceGenerationOverrideRepository
  ) {}

  public async execute(input: GenerateResumeContentInput): Promise<ResumeContentDto> {
    const jd = await this.jobDescriptionRepository.findById(input.jobDescriptionId);
    if (!jd) {
      throw new EntityNotFoundError('JobDescription', input.jobDescriptionId);
    }

    const profile = await this.profileRepository.findSingle();

    const settings =
      (await this.generationSettingsRepository.findByProfileId(profile.id)) ??
      GenerationSettings.createDefault(profile.id);

    const allExperiences = await this.experienceRepository.findAll();
    const experiences = allExperiences
      .filter(e => e.profileId === profile.id)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const overrides = await this.experienceGenerationOverrideRepository.findByExperienceIds(experiences.map(e => e.id));
    const overrideMap = new Map(overrides.map(o => [o.experienceId, o]));

    const composedPrompt = this.composePrompt(settings, input.scope, input.additionalPrompt);

    const existing = await this.resumeContentRepository.findLatestByJobDescriptionId(jd.id);

    const generatorInput = {
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        about: profile.about
      },
      jobDescription: {
        title: jd.title,
        description: jd.description,
        rawText: jd.rawText
      },
      experiences: experiences.map(exp => {
        const override = overrideMap.get(exp.id);
        return {
          id: exp.id,
          title: exp.title,
          companyName: exp.companyName,
          summary: exp.summary,
          accomplishments: exp.accomplishments.map(a => ({
            title: a.title,
            narrative: a.narrative
          })),
          minBullets: override?.bulletMin ?? settings.bulletMin,
          maxBullets: override?.bulletMax ?? settings.bulletMax
        };
      }),
      additionalPrompt: input.additionalPrompt,
      scope: input.scope,
      model: resolveModelId(settings.modelTier),
      composedPrompt: composedPrompt ?? undefined
    };

    const result = await this.generator.generate(generatorInput);

    let headline: string;
    let mergedExperiences: typeof result.experiences;

    const resolveExperienceMeta = (experienceId: string) => {
      const exp = experiences.find(e => e.id === experienceId);
      return { experienceTitle: exp?.title ?? '', companyName: exp?.companyName ?? '' };
    };

    const existingExperienceMap = new Map(
      existing?.experiences.map(e => [
        e.experienceId,
        { bullets: e.bullets, hiddenBulletIndices: e.hiddenBulletIndices }
      ]) ?? []
    );

    if (input.scope?.type === 'headline') {
      headline = result.headline;
      mergedExperiences = existing
        ? existing.experiences.map(e => ({
            experienceId: e.experienceId,
            ...resolveExperienceMeta(e.experienceId),
            summary: e.summary,
            bullets: e.bullets
          }))
        : [];
    } else if (input.scope?.type === 'experience') {
      headline = existing?.headline ?? result.headline;
      const prev = existing
        ? existing.experiences.map(e => ({
            experienceId: e.experienceId,
            ...resolveExperienceMeta(e.experienceId),
            summary: e.summary,
            bullets: e.bullets
          }))
        : [];
      const regenerated = result.experiences[0];
      if (regenerated) {
        mergedExperiences = prev.map(e => (e.experienceId === regenerated.experienceId ? regenerated : e));
      } else {
        mergedExperiences = prev;
      }
    } else {
      headline = result.headline;
      mergedExperiences = result.experiences;
    }

    const isScoped = input.scope != null;

    let hiddenEducationIds: string[];
    if (existing) {
      hiddenEducationIds = existing.hiddenEducationIds;
    } else {
      const allEducations = await this.educationRepository.findAll();
      hiddenEducationIds = allEducations.filter(e => e.hiddenByDefault).map(e => e.id);
    }

    // Deduplicate experiences by ID (keep first occurrence)
    const seen = new Set<string>();
    const deduped = mergedExperiences.filter(e => {
      if (seen.has(e.experienceId)) return false;
      seen.add(e.experienceId);
      return true;
    });

    const resumeContent = ResumeContent.create({
      profileId: profile.id,
      jobDescriptionId: jd.id,
      headline,
      experiences: deduped.map(e => ({
        experienceId: e.experienceId,
        summary: e.summary,
        bullets: e.bullets,
        hiddenBulletIndices: isScoped ? this.resolveHiddenIndices(e, existingExperienceMap.get(e.experienceId)) : []
      })),
      hiddenEducationIds,
      prompt: result.requestPrompt,
      schema: result.requestSchema
    });
    await this.resumeContentRepository.save(resumeContent);

    return {
      headline,
      experiences: mergedExperiences.map(e => ({
        experienceId: e.experienceId,
        experienceTitle: e.experienceTitle,
        companyName: e.companyName,
        bullets: e.bullets
      }))
    };
  }

  private resolveHiddenIndices(
    experience: { bullets: string[] },
    existing?: { bullets: string[]; hiddenBulletIndices: number[] }
  ): number[] {
    if (!existing || existing.hiddenBulletIndices.length === 0) return [];
    // Only preserve hidden status for bullets whose content is unchanged
    return existing.hiddenBulletIndices.filter(
      i => i < experience.bullets.length && i < existing.bullets.length && experience.bullets[i] === existing.bullets[i]
    );
  }

  private composePrompt(
    settings: GenerationSettings,
    scope: GenerateResumeContentScope | undefined,
    additionalPrompt: string | undefined
  ): string | null {
    const parts: string[] = [];

    const resumePrompt = settings.getPrompt(GenerationScope.RESUME);
    if (resumePrompt) parts.push(resumePrompt);

    if (scope?.type === 'headline') {
      const headlinePrompt = settings.getPrompt(GenerationScope.HEADLINE);
      if (headlinePrompt) parts.push(headlinePrompt);
    } else if (scope?.type === 'experience') {
      const experiencePrompt = settings.getPrompt(GenerationScope.EXPERIENCE);
      if (experiencePrompt) parts.push(experiencePrompt);
    }

    if (additionalPrompt) parts.push(additionalPrompt);

    return parts.length > 0 ? parts.join('\n\n') : null;
  }
}
