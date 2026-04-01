export type TagProfileDto = {
  roleWeights: Record<string, number>;
  skillWeights: Record<string, number>;
};

export type ContentSelectionDto = {
  experienceSelections: { experienceId: string; bulletVariantIds: string[] }[];
  projectIds: string[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
};

export type ArchetypeDto = {
  id: string;
  key: string;
  label: string;
  headlineId: string | null;
  tagProfile: TagProfileDto;
  contentSelection: ContentSelectionDto;
};
