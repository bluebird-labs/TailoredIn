import type { ExperienceSelection, TemplateStyle } from '@tailoredin/domain';

export type GenerateResumeDto = {
  headlineId: string;
  experienceSelections: ExperienceSelection[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  templateStyle: TemplateStyle;
  keywords?: string[];
};
