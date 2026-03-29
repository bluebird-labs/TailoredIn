import type { Company, JobPosting, JobStatus } from '@tailoredin/domain';

export interface JobElector {
  elect(job: JobPosting, company: Company): JobStatus;
}
