import type { AccomplishmentDto } from './AccomplishmentDto.js';
import type { CompanyDto } from './CompanyDto.js';
import type { ExperienceSkillDto } from './ExperienceSkillDto.js';

export type { AccomplishmentDto };

export type ExperienceDto = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyAccent: string | null;
  companyId: string | null;
  company: CompanyDto | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  bulletMin: number;
  bulletMax: number;
  accomplishments: AccomplishmentDto[];
  skills: ExperienceSkillDto[];
};
