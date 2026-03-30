import type { JobPosting, JobRepository } from '@tailoredin/domain';

export type GetTopJobInput = {
  targetSalary: number;
  hoursPostedMax?: number;
};

export class GetTopJob {
  public constructor(private readonly jobRepository: JobRepository) {}

  public async execute(input: GetTopJobInput): Promise<JobPosting | null> {
    const results = await this.jobRepository.findTopScored({
      top: 1,
      targetSalary: input.targetSalary,
      hoursPostedMax: input.hoursPostedMax
    });

    return results[0] ?? null;
  }
}
