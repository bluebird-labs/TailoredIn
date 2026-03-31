export type ArchetypePositionBulletDto = {
  bulletId: string;
  ordinal: number;
};

export type ArchetypePositionDto = {
  id: string;
  resumePositionId: string;
  jobTitle: string | null;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string | null;
  endDate: string | null;
  roleSummary: string | null;
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
