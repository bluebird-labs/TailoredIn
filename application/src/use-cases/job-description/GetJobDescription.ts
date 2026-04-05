import { JobDescriptionId, type JobDescriptionRepository } from '@tailoredin/domain';
import type { JobDescriptionDto } from '../../dtos/JobDescriptionDto.js';
import { toJobDescriptionDto } from '../../dtos/JobDescriptionDto.js';

export type GetJobDescriptionInput = {
  jobDescriptionId: string;
};

export class GetJobDescription {
  public constructor(private readonly jobDescriptionRepository: JobDescriptionRepository) {}

  public async execute(input: GetJobDescriptionInput): Promise<JobDescriptionDto> {
    const jd = await this.jobDescriptionRepository.findById(new JobDescriptionId(input.jobDescriptionId));
    if (!jd) {
      throw new Error(`JobDescription not found: ${input.jobDescriptionId}`);
    }
    return toJobDescriptionDto(jd);
  }
}
