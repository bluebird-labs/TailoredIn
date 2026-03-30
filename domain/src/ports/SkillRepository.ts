import type { Skill, SkillCreateProps } from '../entities/Skill.js';

export type SkillRefreshOutput = {
  createdCount: number;
  deletedCount: number;
  updatedCount: number;
  totalCount: number;
};

export interface SkillRepository {
  refreshAll(skills: SkillCreateProps[]): Promise<SkillRefreshOutput>;
  findAll(): Promise<Skill[]>;
}
