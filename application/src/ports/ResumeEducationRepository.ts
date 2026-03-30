import type { ResumeEducation } from '@tailoredin/domain';

export interface ResumeEducationRepository {
  findAllByUserId(userId: string): Promise<ResumeEducation[]>;
  save(education: ResumeEducation): Promise<void>;
  delete(id: string): Promise<void>;
}
