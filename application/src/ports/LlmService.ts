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

export type GenerateCompanyBriefInput = {
  companyName: string;
  companyWebsite: string | null;
  jobTitle: string;
  jobDescription: string;
};

export type CompanyBriefSectionsDto = {
  productOverview: string;
  techStack: string;
  culture: string;
  recentNews: string;
  keyPeople: string;
};

export interface LlmService {
  extractJobPostingInsights(input: ExtractJobPostingInsightsInput): Promise<JobPostingInsightsDto>;
  extractApplicationInsights(input: ExtractApplicationInsightsInput): Promise<ApplicationInsightsDto>;
  generateCompanyBrief(input: GenerateCompanyBriefInput): Promise<CompanyBriefSectionsDto>;
}
