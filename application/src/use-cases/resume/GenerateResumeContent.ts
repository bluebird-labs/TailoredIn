import {
  EntityNotFoundError,
  type ExperienceRepository,
  type HeadlineRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import type { ResumeContentDto } from '../../dtos/ResumeContentDto.js';
import type { ResumeContentGenerator } from '../../ports/ResumeContentGenerator.js';

export type GenerateResumeContentInput = {
  jobDescriptionId: string;
};

const BULLET_LIMITS: Array<{ min: number; max: number }> = [
  { min: 2, max: 12 },
  { min: 2, max: 10 },
  { min: 2, max: 8 },
  { min: 2, max: 6 }
];
const BULLET_LIMITS_DEFAULT = { min: 2, max: 3 };

export class GenerateResumeContent {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly headlineRepository: HeadlineRepository,
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

    const allHeadlines = await this.headlineRepository.findAll();
    const headline =
      allHeadlines
        .filter(h => h.profileId === profile.id.value)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;

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
      headline: headline ? { summaryText: headline.summaryText } : null,
      jobDescription: {
        title: jd.title,
        description: jd.description,
        rawText: jd.rawText
      },
      experiences: experiences.map((exp, index) => {
        const limits = BULLET_LIMITS[index] ?? BULLET_LIMITS_DEFAULT;
        return {
          id: exp.id.value,
          title: exp.title,
          companyName: exp.companyName,
          summary: exp.summary,
          accomplishments: exp.accomplishments.map(a => ({
            title: a.title,
            narrative: a.narrative
          })),
          minBullets: limits.min,
          maxBullets: limits.max
        };
      })
    });

    return {
      experiences: result.experiences.map(e => ({
        experienceId: e.experienceId,
        experienceTitle: e.experienceTitle,
        companyName: e.companyName,
        bullets: e.bullets
      }))
    };
  }
}
