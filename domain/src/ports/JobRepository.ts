import type { Company } from '../entities/Company.js';
import type { JobPosting, JobPostingCreateProps } from '../entities/JobPosting.js';
import type { JobStatus } from '../value-objects/JobStatus.js';

export type FindPaginatedParams = {
  page: number;
  pageSize: number;
  targetSalary: number;
  statuses?: JobStatus[];
  sortBy?: 'score' | 'posted_at';
  sortDir?: 'asc' | 'desc';
  expertWeight?: number;
  interestWeight?: number;
  avoidWeight?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type JobListItem = {
  job: JobPosting;
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
  findScoredByIdOrFail(params: FindScoredParams): Promise<{ job: JobPosting; companyName: string }>;
  findTopScored(params: FindTopScoredParams): Promise<JobPosting[]>;
  findPaginated(params: FindPaginatedParams): Promise<PaginatedResult<JobListItem>>;
  upsertByLinkedinId(props: UpsertJobProps, company: Company): Promise<JobPosting>;
  save(job: JobPosting): Promise<void>;
  retireOlderThan(olderThan: Date): Promise<number>;
}
