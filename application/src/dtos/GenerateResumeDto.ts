import type { ExperienceSelection } from '@tailoredin/domain';

export type GenerateResumeDto = {
  headlineId: string;
  experienceSelections: ExperienceSelection[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  keywords?: string[];
};
