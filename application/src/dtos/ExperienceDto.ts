import type { AccomplishmentDto } from './AccomplishmentDto.js';
import type { CompanyDto } from './CompanyDto.js';

export type { AccomplishmentDto };

export type ExperienceDto = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyId: string | null;
  company: CompanyDto | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
};
