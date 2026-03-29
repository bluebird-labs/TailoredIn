import type { Company, Job, JobStatus } from '@tailoredin/db';

export interface IJobElector {
  elect(job: Job, company: Company): Promise<JobStatus>;
}
