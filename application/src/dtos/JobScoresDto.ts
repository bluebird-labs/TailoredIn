import type { SkillAffinity } from '@tailoredin/domain';

export type SkillScoreDto = {
  score: number;
  matchedSkillIds: string[];
};

export type JobScoresDto = {
  salary: number | null;
  skills: Record<SkillAffinity, SkillScoreDto> & { total: SkillScoreDto };
};
