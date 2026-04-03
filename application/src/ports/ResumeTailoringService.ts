import type { LlmProposal } from '@tailoredin/domain';

export interface ResumeTailoringService {
  tailorFromJd(jdContent: string, rawMarkdown: string): Promise<LlmProposal>;
}
