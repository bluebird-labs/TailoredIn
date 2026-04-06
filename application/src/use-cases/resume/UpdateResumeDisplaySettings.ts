import { EntityNotFoundError, type ResumeContentRepository } from '@tailoredin/domain';

export type UpdateResumeDisplaySettingsInput = {
  jobDescriptionId: string;
  experienceBulletCounts?: Array<{ experienceId: string; displayedBulletCount: number | null }>;
  hiddenEducationIds?: string[];
};

export class UpdateResumeDisplaySettings {
  public constructor(private readonly resumeContentRepository: ResumeContentRepository) {}

  public async execute(input: UpdateResumeDisplaySettingsInput): Promise<void> {
    let resumeContent = await this.resumeContentRepository.findLatestByJobDescriptionId(input.jobDescriptionId);
    if (!resumeContent) {
      throw new EntityNotFoundError('ResumeContent', input.jobDescriptionId);
    }

    if (input.experienceBulletCounts) {
      for (const { experienceId, displayedBulletCount } of input.experienceBulletCounts) {
        resumeContent = resumeContent.withExperienceBulletCount(experienceId, displayedBulletCount);
      }
    }

    if (input.hiddenEducationIds !== undefined) {
      resumeContent = resumeContent.withHiddenEducationIds(input.hiddenEducationIds);
    }

    await this.resumeContentRepository.update(resumeContent);
  }
}
