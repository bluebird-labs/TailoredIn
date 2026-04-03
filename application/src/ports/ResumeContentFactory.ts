import type { ExperienceSelection, GeneratedContent } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type MakeResumeContentFromSelectionInput = {
  profileId: string;
  headlineText: string;
  experienceSelections: ExperienceSelection[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  keywords: string[];
};

export type MakeResumeContentFromGeneratedInput = {
  profileId: string;
  headlineText: string;
  generatedContent: GeneratedContent;
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  keywords: string[];
};

export interface ResumeContentFactory {
  makeFromSelection(input: MakeResumeContentFromSelectionInput): Promise<ResumeContentDto>;
  makeFromGeneratedContent(input: MakeResumeContentFromGeneratedInput): Promise<ResumeContentDto>;
}
