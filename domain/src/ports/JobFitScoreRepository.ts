import type { JobFitScore } from '../entities/JobFitScore.js';

export interface JobFitScoreRepository {
  findByJobDescriptionId(jobDescriptionId: string): Promise<JobFitScore | null>;
  findByJobDescriptionIds(jobDescriptionIds: string[]): Promise<JobFitScore[]>;
  save(score: JobFitScore): Promise<void>;
}
