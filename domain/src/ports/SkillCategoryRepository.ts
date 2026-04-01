import type { SkillCategory } from '../entities/SkillCategory.js';

export interface SkillCategoryRepository {
  findByIdOrFail(id: string): Promise<SkillCategory>;
  findByItemIdOrFail(itemId: string): Promise<SkillCategory>;
  findAll(): Promise<SkillCategory[]>;
  save(category: SkillCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
