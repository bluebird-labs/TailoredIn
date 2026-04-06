import {
  DEFAULT_RESUME_TEMPLATE,
  type EducationRepository,
  EntityNotFoundError,
  type ExperienceRepository,
  type HeadlineRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import type { ResumeContentGenerator } from '../../ports/ResumeContentGenerator.js';
import type { ResumeRenderInput } from '../../ports/ResumeRenderer.js';
import {
  DEFAULT_RESUME_THEME,
  type ResumeRendererFactory,
  type ResumeTheme
} from '../../ports/ResumeRendererFactory.js';

export type GenerateResumePdfInput = {
  jobDescriptionId: string;
  headlineId: string;
  theme?: ResumeTheme;
};

const BULLET_LIMITS = { min: 2, max: 20 };

function extractLinkedinSlug(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '');
}

function extractGithubUsername(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, '');
}

export class GenerateResumePdf {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly headlineRepository: HeadlineRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly educationRepository: EducationRepository,
    private readonly jobDescriptionRepository: JobDescriptionRepository,
    private readonly generator: ResumeContentGenerator,
    private readonly rendererFactory: ResumeRendererFactory
  ) {}

  public async execute(input: GenerateResumePdfInput): Promise<Uint8Array> {
    const jd = await this.jobDescriptionRepository.findById(new JobDescriptionId(input.jobDescriptionId));
    if (!jd) {
      throw new EntityNotFoundError('JobDescription', input.jobDescriptionId);
    }

    const profile = await this.profileRepository.findSingle();

    const allHeadlines = await this.headlineRepository.findAll();
    const headline = allHeadlines.find(h => h.id.value === input.headlineId) ?? null;
    if (!headline) {
      throw new EntityNotFoundError('Headline', input.headlineId);
    }

    const allExperiences = await this.experienceRepository.findAll();
    const experiences = allExperiences
      .filter(e => e.profileId === profile.id.value)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const allEducations = await this.educationRepository.findAll();
    const educations = allEducations
      .filter(e => e.profileId === profile.id.value)
      .sort((a, b) => b.graduationYear - a.graduationYear);

    const storedExperiences = jd.resumeOutput?.output?.experiences as
      | Array<{ experienceId: string; summary: string; bullets: string[] }>
      | undefined;

    const generatedByExperienceId = new Map<string, { summary: string; bullets: string[] }>();

    if (storedExperiences?.length) {
      for (const e of storedExperiences) {
        generatedByExperienceId.set(e.experienceId, e);
      }
    } else {
      const generated = await this.generator.generate({
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          about: profile.about
        },
        headline: { summaryText: headline.summaryText },
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
        })
      });
      for (const e of generated.experiences) {
        generatedByExperienceId.set(e.experienceId, e);
      }
    }

    const renderInput: ResumeRenderInput = {
      personal: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: extractLinkedinSlug(profile.linkedinUrl),
        github: extractGithubUsername(profile.githubUrl),
        website: profile.websiteUrl
      },
      headlineSummary: headline.summaryText,
      experiences: experiences.map(exp => {
        const gen = generatedByExperienceId.get(exp.id.value);
        return {
          title: exp.title,
          companyName: exp.companyName,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate || null,
          summary: gen?.summary ?? null,
          bullets: gen?.bullets ?? []
        };
      }),
      educations: educations.map(edu => ({
        degreeTitle: edu.degreeTitle,
        institutionName: edu.institutionName,
        graduationYear: edu.graduationYear,
        location: edu.location,
        honors: edu.honors
      })),
      template: DEFAULT_RESUME_TEMPLATE
    };

    const renderer = this.rendererFactory.get(input.theme ?? DEFAULT_RESUME_THEME);
    return renderer.render(renderInput);
  }
}
