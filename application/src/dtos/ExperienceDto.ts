import type { AccomplishmentDto } from './AccomplishmentDto.js';

export type { AccomplishmentDto };

export type ExperienceDto = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
};
