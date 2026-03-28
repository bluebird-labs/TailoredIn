export enum JobStatus {
  NEW = 'NEW',
  UNFIT = 'UNFIT',
  LATER = 'LATER',
  APPLIED = 'APPLIED',
  RECRUITER_SCREEN = 'RECRUITER_SCREEN',
  TECHNICAL_SCREEN = 'TECHNICAL_SCREEN',
  ON_SITE = 'ON_SITE',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED',
  NO_NEWS = 'NO_NEWS',
  EXPIRED = 'EXPIRED',
  LOW_SALARY = 'LOW_SALARY'
}

export type Company = {
  id: string
  name: string
  logo_url: string
  linkedin_link: string
  created_at: string
  updated_at: string
}

export type Job = {
  id: string
  linkedin_id: string
  company_id: string
  company: Company;
  title: string
  linkedin_link: string
  type: string | null
  level: string | null
  remote: string | null
  posted_at: Date | null
  is_repost: boolean | null
  location_raw: string
  salary_low: number | null
  salary_high: number | null
  salary_raw: string | null
  description: string
  description_html: string;
  description_items: JobDescriptionItem[];
  status: JobStatus
  created_at: string
  updated_at: string
}

export enum JobDescriptionItemRole {
  TITLE = 'title',
  TEXT = 'text',
  LIST = 'list',
  BR = 'br'
}

export type JobDescriptionTitleItem = {
  role: JobDescriptionItemRole.TITLE;
  text: string;
};

export type JobDescriptionTextItem = {
  role: JobDescriptionItemRole.TEXT;
  text: string;
};

export type JobDescriptionListItem = {
  role: JobDescriptionItemRole.LIST;
  text: string[];
};

export type JobDescriptionBrItem = {
  role: JobDescriptionItemRole.BR;
  text: '\n';
};

export type JobDescriptionItem =
  | JobDescriptionTextItem
  | JobDescriptionTitleItem
  | JobDescriptionListItem
  | JobDescriptionBrItem;
