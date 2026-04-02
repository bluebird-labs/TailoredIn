import type { ExperienceSelection } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type MakeResumeContentInput = {
  profileId: string;
  archetypeId: string;
  awesomeColor: string;
  keywords: string[];
};

export type MakeResumeContentFromSelectionInput = {
  profileId: string;
  headlineId: string;
  experienceSelections: ExperienceSelection[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  awesomeColor: string;
  keywords: string[];
};

export interface ResumeContentFactory {
  make(input: MakeResumeContentInput): Promise<ResumeContentDto>;
  makeFromSelection(input: MakeResumeContentFromSelectionInput): Promise<ResumeContentDto>;
}
