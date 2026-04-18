import type { RequirementCoverage } from '@tailoredin/domain';

export type RequirementScoreDto = {
  readonly requirement: string;
  readonly coverage: RequirementCoverage;
  readonly matchingBulletIndices: number[];
  readonly reasoning: string;
};

export type ResumeScoreDto = {
  readonly overall: number;
  readonly requirements: RequirementScoreDto[];
  readonly summary: string;
};
