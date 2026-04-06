import {
  EntityNotFoundError,
  type ExperienceRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { ResumeContentGenerator } from '../../ports/ResumeContentGenerator.js';

export type GenerateResumeContentScope =
  | { type: 'headline' }
  | { type: 'experience'; experienceId: string };

export type GenerateResumeContentInput = {
  jobDescriptionId: string;
  additionalPrompt?: string;
  scope?: GenerateResumeContentScope;
};

const BULLET_LIMITS = { min: 2, max: 20 };

export class GenerateResumeContent {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly jobDescriptionRepository: JobDescriptionRepository,
    private readonly generator: ResumeContentGenerator
  ) {}

  public async execute(input: GenerateResumeContentInput): Promise<ResumeContentDto> {
    const jd = await this.jobDescriptionRepository.findById(new JobDescriptionId(input.jobDescriptionId));
    if (!jd) {
      throw new EntityNotFoundError('JobDescription', input.jobDescriptionId);
    }

    const profile = await this.profileRepository.findSingle();

    const allExperiences = await this.experienceRepository.findAll();
    const experiences = allExperiences
      .filter(e => e.profileId === profile.id.value)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

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
        return {
          id: exp.id.value,
          title: exp.title,
          companyName: exp.companyName,
          summary: exp.summary,
          accomplishments: exp.accomplishments.map(a => ({
            title: a.title,
            narrative: a.narrative
          })),
          minBullets: BULLET_LIMITS.min,
          maxBullets: BULLET_LIMITS.max
        };
      }),
      additionalPrompt: input.additionalPrompt,
      scope: input.scope
    };

    const result = await this.generator.generate(generatorInput);

    const existing = jd.resumeOutput?.output as
      | { headline?: string; experiences?: Array<{ experienceId: string; experienceTitle: string; companyName: string; summary: string; bullets: string[] }> }
      | undefined;

    let headline: string;
    let mergedExperiences: typeof result.experiences;

    if (input.scope?.type === 'headline') {
      headline = result.headline;
      mergedExperiences = (existing?.experiences as typeof result.experiences) ?? [];
    } else if (input.scope?.type === 'experience') {
      headline = existing?.headline ?? result.headline;
      const prev = (existing?.experiences as typeof result.experiences) ?? [];
      const regenerated = result.experiences[0];
      if (regenerated) {
        mergedExperiences = prev.map(e =>
          e.experienceId === regenerated.experienceId ? regenerated : e
        );
      } else {
        mergedExperiences = prev;
      }
    } else {
      headline = result.headline;
      mergedExperiences = result.experiences;
    }

    jd.resumeOutput = {
      schema: result.requestSchema,
      output: { headline, experiences: mergedExperiences },
      generatedAt: new Date()
    };
    await this.jobDescriptionRepository.save(jd);

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
}
