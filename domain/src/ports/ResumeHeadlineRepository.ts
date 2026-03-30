import type { ResumeHeadline } from '../entities/ResumeHeadline.js';

export interface ResumeHeadlineRepository {
  findByIdOrFail(id: string): Promise<ResumeHeadline>;
  findAllByUserId(userId: string): Promise<ResumeHeadline[]>;
  save(headline: ResumeHeadline): Promise<void>;
  delete(id: string): Promise<void>;
}
