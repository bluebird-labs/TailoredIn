import type { ExperienceSelection, TemplateKey } from '@tailoredin/domain';

export type GenerateResumeDto = {
  headlineText: string;
  experienceSelections: ExperienceSelection[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
  keywords?: string[];
  templateKey?: TemplateKey;
};
