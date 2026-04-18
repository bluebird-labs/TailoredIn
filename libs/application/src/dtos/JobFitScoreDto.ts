import type { RequirementCoverage } from '@tailoredin/domain';

export type JobFitRequirementDto = {
  readonly requirement: string;
  readonly coverage: RequirementCoverage;
  readonly reasoning: string;
};

export type JobFitScoreDto = {
  readonly id: string;
  readonly overall: number;
  readonly requirements: JobFitRequirementDto[];
  readonly summary: string;
  readonly createdAt: string;
};
