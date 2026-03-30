import type { ResumeEducation } from '../entities/ResumeEducation.js';

export interface ResumeEducationRepository {
  findByIdOrFail(id: string): Promise<ResumeEducation>;
  findAllByUserId(userId: string): Promise<ResumeEducation[]>;
  save(education: ResumeEducation): Promise<void>;
  delete(id: string): Promise<void>;
}
