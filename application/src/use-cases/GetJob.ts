import type { JobPosting, JobRepository } from '@tailoredin/domain';

export type GetJobInput = {
  jobId: string;
  targetSalary: number;
};

export type GetJobOutput = {
  job: JobPosting;
  companyName: string;
};

export class GetJob {
  public constructor(private readonly jobRepository: JobRepository) {}

  public async execute(input: GetJobInput): Promise<GetJobOutput> {
    return this.jobRepository.findScoredByIdOrFail({
      jobId: input.jobId,
      targetSalary: input.targetSalary
    });
  }
}
