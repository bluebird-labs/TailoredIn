import {
  type ExperienceRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ResumeContentRepository
} from '@tailoredin/domain';
import type { JobDescriptionDto } from '../../dtos/JobDescriptionDto.js';
import { toJobDescriptionDto } from '../../dtos/JobDescriptionDto.js';

export type GetJobDescriptionInput = {
  jobDescriptionId: string;
};

export class GetJobDescription {
  public constructor(
    private readonly jobDescriptionRepository: JobDescriptionRepository,
    private readonly resumeContentRepository: ResumeContentRepository,
    private readonly experienceRepository: ExperienceRepository
  ) {}

  public async execute(input: GetJobDescriptionInput): Promise<JobDescriptionDto> {
    const jd = await this.jobDescriptionRepository.findById(new JobDescriptionId(input.jobDescriptionId));
    if (!jd) {
      throw new Error(`JobDescription not found: ${input.jobDescriptionId}`);
    }
    const resumeContent = await this.resumeContentRepository.findLatestByJobDescriptionId(jd.id.value);
    const experiences = resumeContent ? await this.experienceRepository.findAll() : [];
    return toJobDescriptionDto(jd, resumeContent, experiences);
  }
}
