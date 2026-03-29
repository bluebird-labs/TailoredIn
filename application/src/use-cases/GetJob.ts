import type { JobPosting } from '@tailoredin/domain';
import type { JobRepository } from '../ports/JobRepository.js';

export type GetJobInput = {
  jobId: string;
  targetSalary: number;
};

export class GetJob {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(input: GetJobInput): Promise<JobPosting> {
    return this.jobRepository.findScoredByIdOrFail({
      jobId: input.jobId,
      targetSalary: input.targetSalary
    });
  }
}
