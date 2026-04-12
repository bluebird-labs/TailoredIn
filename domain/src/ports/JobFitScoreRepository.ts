import type { JobFitScore } from '../entities/JobFitScore.js';

export interface JobFitScoreRepository {
  findByJobDescriptionId(jobDescriptionId: string): Promise<JobFitScore | null>;
  save(score: JobFitScore): Promise<void>;
}
