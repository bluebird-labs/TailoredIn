import type { TagDto } from './TagDto.js';

export type BulletVariantDto = {
  id: string;
  text: string;
  angle: string;
  source: string;
  approvalStatus: string;
  roleTags: TagDto[];
  skillTags: TagDto[];
};

export type BulletDto = {
  id: string;
  content: string;
  ordinal: number;
  roleTags: TagDto[];
  skillTags: TagDto[];
  variants: BulletVariantDto[];
};

export type ExperienceDto = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  bullets: BulletDto[];
};
