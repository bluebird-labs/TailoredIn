import type { Company } from '../entities/Company.js';
import type { JobPosting } from '../entities/JobPosting.js';
import type { JobStatus } from '../value-objects/JobStatus.js';

export interface JobElector {
  elect(job: JobPosting, company: Company): JobStatus;
}
