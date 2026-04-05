import type { JobDescription } from '../entities/JobDescription.js';
import type { JobDescriptionId } from '../value-objects/JobDescriptionId.js';

export interface JobDescriptionRepository {
  findById(id: JobDescriptionId): Promise<JobDescription | null>;
  findByCompanyId(companyId: string): Promise<JobDescription[]>;
  save(jobDescription: JobDescription): Promise<void>;
  delete(id: JobDescriptionId): Promise<void>;
}
