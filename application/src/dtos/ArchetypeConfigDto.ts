export type ArchetypePositionBulletDto = {
  bulletId: string;
  ordinal: number;
};

export type ArchetypePositionDto = {
  id: string;
  resumeCompanyId: string;
  jobTitle: string;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string;
  endDate: string;
  roleSummary: string;
  ordinal: number;
  bullets: ArchetypePositionBulletDto[];
};

export type ArchetypeConfigDto = {
  id: string;
  archetypeKey: string;
  archetypeLabel: string;
  archetypeDescription: string | null;
  headlineId: string;
  socialNetworks: string[];
  positions: ArchetypePositionDto[];
  educationSelections: { educationId: string; ordinal: number }[];
  skillCategorySelections: { categoryId: string; ordinal: number }[];
  skillItemSelections: { itemId: string; ordinal: number }[];
};
