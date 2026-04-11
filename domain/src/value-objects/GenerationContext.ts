import type { BusinessType } from './BusinessType.js';
import type { CompanyStage } from './CompanyStage.js';
import type { GenerationScope } from './GenerationScope.js';
import type { Industry } from './Industry.js';
import type { JobLevel } from './JobLevel.js';
import type { ModelTier } from './ModelTier.js';

export type ProfileSnapshot = {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly about: string | null;
  readonly location: string | null;
};

export type JDSnapshot = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly rawText: string | null;
  readonly soughtHardSkills: string[];
  readonly soughtSoftSkills: string[];
  readonly level: JobLevel | null;
};

export type AccomplishmentSnapshot = {
  readonly title: string;
  readonly narrative: string;
};

export type ExperienceSnapshot = {
  readonly id: string;
  readonly title: string;
  readonly companyName: string;
  readonly summary: string | null;
  readonly accomplishments: AccomplishmentSnapshot[];
  readonly startDate: string;
  readonly endDate: string;
  readonly location: string;
  readonly bulletMin: number;
  readonly bulletMax: number;
  readonly companyId: string | null;
};

export type CompanySnapshot = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly industry: Industry;
  readonly stage: CompanyStage;
  readonly businessType: BusinessType;
};

export type EducationSnapshot = {
  readonly id: string;
  readonly degreeTitle: string;
  readonly institutionName: string;
  readonly graduationYear: number;
  readonly honors: string | null;
};

export type SettingsSnapshot = {
  readonly modelTier: ModelTier;
  readonly bulletMin: number;
  readonly bulletMax: number;
  readonly adminPrompts: ReadonlyMap<GenerationScope, string>;
};

export type GenerationContext = {
  readonly profile: ProfileSnapshot;
  readonly jobDescription: JDSnapshot;
  readonly experiences: ExperienceSnapshot[];
  readonly companies: CompanySnapshot[];
  readonly education: EducationSnapshot[];
  readonly settings: SettingsSnapshot;
  readonly userInstructions: string | null;
};
