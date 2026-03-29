import { inject, injectable } from '@needle-di/core';
import type { JobStatus } from '@tailoredin/domain-job';
import { ok, err, type Result } from '@tailoredin/domain-shared';
import { ApplicationJobDI } from '../DI.js';
import type { JobRepository } from '../ports/JobRepository.js';

export type ChangeJobStatusInput = {
  jobId: string;
  newStatus: JobStatus;
};

@injectable()
export class ChangeJobStatus {
  constructor(private readonly jobRepository = inject(ApplicationJobDI.JobRepository)) {}

  async execute(input: ChangeJobStatusInput): Promise<Result<void, Error>> {
    let job;
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
