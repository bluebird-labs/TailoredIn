import type { Archetype } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type JobPostingInsightsDto = {
  website: string | null;
  archetype: Archetype;
};

export type ApplicationInsightsDto = {
  keywords: string[];
  coreSkills: string[];
};

export type ExtractJobPostingInsightsInput = {
  jobDescription: string;
  companyName: string;
  jobTitle: string;
  jobLocation: string;
};

export type ExtractApplicationInsightsInput = {
  jobDescription: string;
  companyName: string;
  jobTitle: string;
  jobLocation: string;
  archetype: Archetype;
  resumeContent: ResumeContentDto;
};

export interface LlmService {
  extractJobPostingInsights(input: ExtractJobPostingInsightsInput): Promise<JobPostingInsightsDto>;
  extractApplicationInsights(input: ExtractApplicationInsightsInput): Promise<ApplicationInsightsDto>;
}
