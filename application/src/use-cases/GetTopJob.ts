import type { JobPosting } from '@tailoredin/domain';
import type { JobRepository } from '../ports/JobRepository.js';

export type GetTopJobInput = {
  targetSalary: number;
  hoursPostedMax?: number;
};

export class GetTopJob {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(input: GetTopJobInput): Promise<JobPosting | null> {
    const results = await this.jobRepository.findTopScored({
      top: 1,
      targetSalary: input.targetSalary,
      hoursPostedMax: input.hoursPostedMax
    });

    return results[0] ?? null;
  }
}
