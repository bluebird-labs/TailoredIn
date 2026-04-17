import { Inject, Injectable } from '@nestjs/common';
import {
  type CompanyRepository,
  type EducationRepository,
  EntityNotFoundError,
  type ExperienceRepository,
  type GenerationContext,
  type GenerationScope,
  GenerationSettings,
  type GenerationSettingsRepository,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import { DI } from '../DI.js';

@Injectable()
export class GenerationContextBuilder {
  public constructor(
    @Inject(DI.Profile.Repository) private readonly profileRepository: ProfileRepository,
    @Inject(DI.JobDescription.Repository) private readonly jobDescriptionRepository: JobDescriptionRepository,
    @Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository,
    @Inject(DI.Education.Repository) private readonly educationRepository: EducationRepository,
    @Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository,
    @Inject(DI.GenerationSettings.Repository)
    private readonly generationSettingsRepository: GenerationSettingsRepository
  ) {}

  public async build(
    profileId: string,
    jobDescriptionId: string,
    userInstructions?: string
  ): Promise<GenerationContext> {
    const jd = await this.jobDescriptionRepository.findById(jobDescriptionId);
    if (!jd) throw new EntityNotFoundError('JobDescription', jobDescriptionId);

    const profile = await this.profileRepository.findByIdOrFail(profileId);

    const settings =
      (await this.generationSettingsRepository.findByProfileId(profile.id)) ??
      GenerationSettings.createDefault(profile.id);

    const allExperiences = await this.experienceRepository.findAll();
    const experiences = allExperiences
      .filter(e => e.profileId === profile.id)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const companyIds = experiences.map(e => e.companyId).filter((id): id is string => id !== null);
    const uniqueCompanyIds = [...new Set(companyIds)];
    const companies = await Promise.all(uniqueCompanyIds.map(id => this.companyRepository.findById(id)));

    const allEducation = await this.educationRepository.findAll();
    const education = allEducation.filter(e => e.profileId === profile.id);

    const adminPrompts = new Map<GenerationScope, string>();
    for (const prompt of settings.prompts.getItems()) {
      adminPrompts.set(prompt.scope as GenerationScope, prompt.content);
    }

    return {
      profile: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        about: profile.about,
        location: profile.location
      },
      jobDescription: {
        id: jd.id,
        title: jd.title,
        description: jd.description,
        rawText: jd.rawText,
        soughtHardSkills: jd.soughtHardSkills ?? [],
        soughtSoftSkills: jd.soughtSoftSkills ?? [],
        level: jd.level
      },
      experiences: experiences.map(exp => ({
        id: exp.id,
        title: exp.title,
        companyName: exp.companyName,
        summary: exp.summary,
        accomplishments: exp.accomplishments.getItems().map(a => ({
          title: a.title,
          narrative: a.narrative
        })),
        startDate: exp.startDate,
        endDate: exp.endDate,
        location: exp.location,
        bulletMin: exp.bulletMin,
        bulletMax: exp.bulletMax,
        companyId: exp.companyId
      })),
      companies: companies
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          industry: c.industry,
          stage: c.stage,
          businessType: c.businessType
        })),
      education: education.map(e => ({
        id: e.id,
        degreeTitle: e.degreeTitle,
        institutionName: e.institutionName,
        graduationYear: e.graduationYear,
        honors: e.honors
      })),
      settings: {
        modelTier: settings.modelTier,
        bulletMin: settings.bulletMin,
        bulletMax: settings.bulletMax,
        adminPrompts
      },
      userInstructions: userInstructions ?? null
    };
  }
}
