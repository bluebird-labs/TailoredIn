import type { Company, JobPosting, JobStatus } from '@tailoredin/domain-job';

export interface JobElector {
  elect(job: JobPosting, company: Company): JobStatus;
}
