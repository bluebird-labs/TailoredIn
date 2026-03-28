import { JobStatus, Job, Company } from '@tailoredin/db';

export interface IJobElector {
  elect(job: Job, company: Company): Promise<JobStatus>;
}
