import {
  DEFAULT_RESUME_TEMPLATE,
  type EducationRepository,
  EntityNotFoundError,
  type ExperienceRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import type { ResumeRenderInput } from '../../ports/ResumeRenderer.js';
import {
  DEFAULT_RESUME_THEME,
  type ResumeRendererFactory,
  type ResumeTheme
} from '../../ports/ResumeRendererFactory.js';

export type GenerateResumePdfInput = {
  jobDescriptionId: string;
  theme?: ResumeTheme;
};

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
    private readonly experienceRepository: ExperienceRepository,
    private readonly educationRepository: EducationRepository,
    private readonly jobDescriptionRepository: JobDescriptionRepository,
    private readonly rendererFactory: ResumeRendererFactory
  ) {}

  public async execute(input: GenerateResumePdfInput): Promise<Uint8Array> {
    const jd = await this.jobDescriptionRepository.findById(new JobDescriptionId(input.jobDescriptionId));
    if (!jd) {
      throw new EntityNotFoundError('JobDescription', input.jobDescriptionId);
    }

    const profile = await this.profileRepository.findSingle();

    const allExperiences = await this.experienceRepository.findAll();
    const experiences = allExperiences
      .filter(e => e.profileId === profile.id.value)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const allEducations = await this.educationRepository.findAll();
    const educations = allEducations
      .filter(e => e.profileId === profile.id.value)
      .sort((a, b) => b.graduationYear - a.graduationYear);

    const storedOutput = jd.resumeOutput?.output as
      | { headline?: string; experiences?: Array<{ experienceId: string; summary: string; bullets: string[] }> }
      | undefined;

    if (!storedOutput?.headline || !storedOutput.experiences?.length) {
      throw new Error('Resume content has not been generated yet. Generate content before creating a PDF.');
    }

    const headlineSummary = storedOutput.headline;
    const generatedByExperienceId = new Map<string, { summary: string; bullets: string[] }>();
    for (const e of storedOutput.experiences) {
      generatedByExperienceId.set(e.experienceId, e);
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
      headlineSummary,
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
