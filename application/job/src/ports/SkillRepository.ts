import type { Skill, SkillCreateProps } from '@tailoredin/domain-job';

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
