import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundError, type ResumeContentRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';

export type UpdateResumeDisplaySettingsInput = {
  jobDescriptionId: string;
  experienceHiddenBullets?: Array<{ experienceId: string; hiddenBulletIndices: number[] }>;
  hiddenEducationIds?: string[];
};

@Injectable()
export class UpdateResumeDisplaySettings {
  public constructor(
    @Inject(DI.ResumeContent.Repository) private readonly resumeContentRepository: ResumeContentRepository
  ) {}

  public async execute(input: UpdateResumeDisplaySettingsInput): Promise<void> {
    let resumeContent = await this.resumeContentRepository.findLatestByJobDescriptionId(input.jobDescriptionId);
    if (!resumeContent) {
      throw new EntityNotFoundError('ResumeContent', input.jobDescriptionId);
    }

    if (input.experienceHiddenBullets) {
      for (const { experienceId, hiddenBulletIndices } of input.experienceHiddenBullets) {
        resumeContent = resumeContent.withExperienceHiddenBullets(experienceId, hiddenBulletIndices);
      }
    }

    if (input.hiddenEducationIds !== undefined) {
      resumeContent = resumeContent.withHiddenEducationIds(input.hiddenEducationIds);
    }

    await this.resumeContentRepository.update(resumeContent);
  }
}
