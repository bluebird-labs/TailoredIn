import type { JobDescription } from '../entities/JobDescription.js';

export interface JobDescriptionRepository {
  findAll(): Promise<JobDescription[]>;
  findById(id: string): Promise<JobDescription | null>;
  findByCompanyId(companyId: string): Promise<JobDescription[]>;
  save(jobDescription: JobDescription): Promise<void>;
  delete(id: string): Promise<void>;
}
