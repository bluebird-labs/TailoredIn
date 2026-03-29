import type { JobPosting, JobStatus } from '@tailoredin/domain';
import { err, ok, type Result } from '@tailoredin/domain';
import type { JobRepository } from '../ports/JobRepository.js';

export type ChangeJobStatusInput = {
  jobId: string;
  newStatus: JobStatus;
};

export class ChangeJobStatus {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(input: ChangeJobStatusInput): Promise<Result<void, Error>> {
    let job: JobPosting;
    try {
      job = await this.jobRepository.findByIdOrFail(input.jobId);
    } catch {
      return err(new Error(`Job not found: ${input.jobId}`));
    }

    job.changeStatus(input.newStatus);
    await this.jobRepository.save(job);

    return ok(undefined);
  }
}
