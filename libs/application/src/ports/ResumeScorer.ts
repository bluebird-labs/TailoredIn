import type { ResumeScore } from '@tailoredin/domain';

export type ResumeScoreInput = {
  jobDescriptionText: string;
  resumeMarkdown: string;
};

export interface ResumeScorer {
  score(input: ResumeScoreInput): Promise<ResumeScore>;
}
