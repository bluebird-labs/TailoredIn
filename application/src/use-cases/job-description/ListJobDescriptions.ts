import type { JobDescriptionRepository } from '@tailoredin/domain';
import type { JobDescriptionDto } from '../../dtos/JobDescriptionDto.js';
import { toJobDescriptionDto } from '../../dtos/JobDescriptionDto.js';

export type ListJobDescriptionsInput = {
  companyId: string;
};

export class ListJobDescriptions {
  public constructor(private readonly jobDescriptionRepository: JobDescriptionRepository) {}

  public async execute(input: ListJobDescriptionsInput): Promise<JobDescriptionDto[]> {
    const jobDescriptions = await this.jobDescriptionRepository.findByCompanyId(input.companyId);
    return jobDescriptions.map(toJobDescriptionDto);
  }
}
