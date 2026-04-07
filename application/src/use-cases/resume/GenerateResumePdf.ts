import {
  DEFAULT_RESUME_TEMPLATE,
  type EducationRepository,
  EntityNotFoundError,
  type ExperienceRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository,
  type ResumeContentRepository
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
    private readonly resumeContentRepository: ResumeContentRepository,
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

    const resumeContent = await this.resumeContentRepository.findLatestByJobDescriptionId(jd.id.value);

    if (!resumeContent) {
      throw new Error('Resume content has not been generated yet. Generate content before creating a PDF.');
    }

    const generatedByExperienceId = new Map<
      string,
      { summary: string; bullets: string[]; hiddenBulletIndices: number[] }
    >();
    for (const e of resumeContent.experiences) {
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
      headlineSummary: resumeContent.headline,
      experiences: experiences.map(exp => {
        const gen = generatedByExperienceId.get(exp.id.value);
        return {
          title: exp.title,
          companyName: exp.companyName,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate || null,
          summary: gen?.summary ?? null,
          bullets: gen ? gen.bullets.filter((_, i) => !gen.hiddenBulletIndices.includes(i)) : []
        };
      }),
      educations: educations
        .filter(edu => !resumeContent.hiddenEducationIds.includes(edu.id.value))
        .map(edu => ({
          degreeTitle: edu.degreeTitle,
          institutionName: edu.institutionName,
          graduationYear: edu.graduationYear,
          location: edu.location,
          honors: edu.honors
        })),
      template: DEFAULT_RESUME_TEMPLATE
    };

    const theme = input.theme ?? DEFAULT_RESUME_THEME;
    const renderer = this.rendererFactory.get(theme);
    const pdfBytes = await renderer.render(renderInput);

    jd.resumePdf = pdfBytes;
    jd.resumePdfTheme = theme;
    jd.updatedAt = new Date();
    await this.jobDescriptionRepository.save(jd);

    return pdfBytes;
  }
}
