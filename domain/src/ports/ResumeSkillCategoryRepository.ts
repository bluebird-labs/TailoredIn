import type { ResumeSkillCategory } from '../entities/ResumeSkillCategory.js';

export interface ResumeSkillCategoryRepository {
  findByIdOrFail(id: string): Promise<ResumeSkillCategory>;
  findAllByUserId(userId: string): Promise<ResumeSkillCategory[]>;
  save(category: ResumeSkillCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
