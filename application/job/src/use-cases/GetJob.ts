import { inject, injectable } from '@needle-di/core';
import type { JobPosting } from '@tailoredin/domain-job';
import { ApplicationJobDI } from '../DI.js';
import type { JobRepository } from '../ports/JobRepository.js';

export type GetJobInput = {
  jobId: string;
  targetSalary: number;
};

@injectable()
export class GetJob {
  constructor(private readonly jobRepository = inject(ApplicationJobDI.JobRepository)) {}

  async execute(input: GetJobInput): Promise<JobPosting> {
    return this.jobRepository.findScoredByIdOrFail({
      jobId: input.jobId,
      targetSalary: input.targetSalary
    });
  }
}
