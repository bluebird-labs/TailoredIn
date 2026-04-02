import type { ExperienceSelection } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type MakeResumeContentInput = {
  profileId: string;
  archetypeId: string;
  keywords: string[];
};

export type MakeResumeContentFromSelectionInput = {
  profileId: string;
  headlineText: string;
  experienceSelections: ExperienceSelection[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  keywords: string[];
};

export interface ResumeContentFactory {
  make(input: MakeResumeContentInput): Promise<ResumeContentDto>;
  makeFromSelection(input: MakeResumeContentFromSelectionInput): Promise<ResumeContentDto>;
}
