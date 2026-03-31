import type { Company } from '../entities/Company.js';
import type { JobPosting, JobPostingCreateProps } from '../entities/JobPosting.js';
import type { BusinessType } from '../value-objects/BusinessType.js';
import type { CompanyStage } from '../value-objects/CompanyStage.js';
import type { Industry } from '../value-objects/Industry.js';
import type { JobStatus } from '../value-objects/JobStatus.js';

export type FindPaginatedParams = {
  limit: number;
  offset: number;
  targetSalary: number;
  statuses?: JobStatus[];
  businessTypes?: BusinessType[];
  industries?: Industry[];
  stages?: CompanyStage[];
  sort: string;
  expertWeight?: number;
  interestWeight?: number;
  avoidWeight?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
};

export type JobListItem = {
  job: JobPosting;
  companyId: string;
  companyName: string;
};

export type FindTopScoredParams = {
  top: number;
  targetSalary: number;
  hoursPostedMax?: number;
  expertWeight?: number;
  interestWeight?: number;
  avoidWeight?: number;
};

export type FindScoredParams = {
  jobId: string;
  targetSalary: number;
  expertWeight?: number;
  interestWeight?: number;
  avoidWeight?: number;
};

export type UpsertJobProps = Omit<JobPostingCreateProps, 'companyId'>;

export interface JobRepository {
  findById(id: string): Promise<JobPosting | null>;
  findByIdOrFail(id: string): Promise<JobPosting>;
  findScoredByIdOrFail(params: FindScoredParams): Promise<{ job: JobPosting; company: Company }>;
  findTopScored(params: FindTopScoredParams): Promise<JobPosting[]>;
  findPaginated(params: FindPaginatedParams): Promise<PaginatedResult<JobListItem>>;
  upsertByLinkedinId(props: UpsertJobProps, company: Company): Promise<JobPosting>;
  save(job: JobPosting): Promise<void>;
  retireOlderThan(olderThan: Date): Promise<number>;
}
