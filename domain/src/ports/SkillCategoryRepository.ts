import type { SkillCategory } from '../entities/SkillCategory.js';

export interface SkillCategoryRepository {
  findAll(): Promise<SkillCategory[]>;
  findByIdOrFail(id: string): Promise<SkillCategory>;
}
