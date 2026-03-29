import { inject, injectable } from '@needle-di/core';
import type { JobPosting } from '@tailoredin/domain-job';
import { ApplicationJobDI } from '../DI.js';
import type { JobRepository } from '../ports/JobRepository.js';

export type GetTopJobInput = {
  targetSalary: number;
  hoursPostedMax?: number;
};

@injectable()
export class GetTopJob {
  constructor(private readonly jobRepository = inject(ApplicationJobDI.JobRepository)) {}

  async execute(input: GetTopJobInput): Promise<JobPosting | null> {
    const results = await this.jobRepository.findTopScored({
      top: 1,
      targetSalary: input.targetSalary,
      hoursPostedMax: input.hoursPostedMax
    });

    return results[0] ?? null;
  }
}
