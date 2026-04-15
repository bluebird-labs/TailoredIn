export type RequirementCoverage = 'strong' | 'partial' | 'not_evidenced' | 'absent';

export type RequirementScore = {
  readonly requirement: string;
  readonly coverage: RequirementCoverage;
  readonly matchingBulletIndices: number[];
  readonly reasoning: string;
};

export type ResumeScore = {
  readonly overall: number;
  readonly requirements: RequirementScore[];
  readonly summary: string;
};
