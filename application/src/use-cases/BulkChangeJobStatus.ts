import { type JobRepository, type JobStatus, ok, type Result } from '@tailoredin/domain';

export type BulkChangeJobStatusInput = {
  jobIds: string[];
  newStatus: JobStatus;
};

export class BulkChangeJobStatus {
  public constructor(private readonly jobRepository: JobRepository) {}

  public async execute(input: BulkChangeJobStatusInput): Promise<Result<{ updated: number }, Error>> {
    let updated = 0;
    for (const id of input.jobIds) {
      const job = await this.jobRepository.findById(id);
      if (job) {
        job.changeStatus(input.newStatus);
        await this.jobRepository.save(job);
        updated++;
      }
    }
    return ok({ updated });
  }
}
