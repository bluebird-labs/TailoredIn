import type { Company } from '../entities/Company.js';
import type { JobPosting, JobPostingCreateProps } from '../entities/JobPosting.js';

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
  findScoredByIdOrFail(params: FindScoredParams): Promise<JobPosting>;
  findTopScored(params: FindTopScoredParams): Promise<JobPosting[]>;
  upsertByLinkedinId(props: UpsertJobProps, company: Company): Promise<JobPosting>;
  save(job: JobPosting): Promise<void>;
  retireOlderThan(olderThan: Date): Promise<number>;
}
