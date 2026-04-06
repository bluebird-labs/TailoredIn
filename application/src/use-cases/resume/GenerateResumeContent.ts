import {
  EntityNotFoundError,
  type ExperienceRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { ResumeContentGenerator } from '../../ports/ResumeContentGenerator.js';

export type GenerateResumeContentInput = {
  jobDescriptionId: string;
  additionalPrompt?: string;
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

    const result = await this.generator.generate({
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
      additionalPrompt: input.additionalPrompt
    });

    jd.resumeOutput = {
      schema: result.requestSchema,
      output: { headline: result.headline, experiences: result.experiences },
      generatedAt: new Date()
    };
    await this.jobDescriptionRepository.save(jd);

    return {
      headline: result.headline,
      experiences: result.experiences.map(e => ({
        experienceId: e.experienceId,
        experienceTitle: e.experienceTitle,
        companyName: e.companyName,
        bullets: e.bullets
      }))
    };
  }
}
