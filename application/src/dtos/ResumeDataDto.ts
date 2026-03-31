export type UserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  githubHandle: string | null;
  linkedinHandle: string | null;
  locationLabel: string | null;
};

export type ResumeLocationDto = {
  label: string;
  ordinal: number;
};

export type ResumeBulletDto = {
  id: string;
  content: string;
  ordinal: number;
};

export type ResumeCompanyDto = {
  id: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  jobTitle: string | null;
  joinedAt: string;
  leftAt: string;
  promotedAt: string | null;
  locations: ResumeLocationDto[];
  bullets: ResumeBulletDto[];
};

export type ResumeEducationEntryDto = {
  id: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: string;
  locationLabel: string;
  ordinal: number;
};

export type ResumeSkillItemDto = {
  id: string;
  skillName: string;
  ordinal: number;
};

export type ResumeSkillCategoryDto = {
  id: string;
  categoryName: string;
  ordinal: number;
  items: ResumeSkillItemDto[];
};

export type ResumeHeadlineDto = {
  id: string;
  headlineLabel: string;
  summaryText: string;
};
