import type { RequirementCoverage } from '@tailoredin/domain';

export type FitScoreInput = {
  jobDescriptionText: string;
  profileMarkdown: string;
};

export type FitScoreResult = {
  overall: number;
  requirements: Array<{
    requirement: string;
    coverage: RequirementCoverage;
    reasoning: string;
  }>;
  summary: string;
};

export interface FitScorer {
  score(input: FitScoreInput): Promise<FitScoreResult>;
}
