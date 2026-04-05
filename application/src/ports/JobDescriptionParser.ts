import type { JobLevel, LocationType } from '@tailoredin/domain';

export type JobDescriptionParseResult = {
  title: string | null;
  description: string | null;
  url: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  level: JobLevel | null;
  locationType: LocationType | null;
  postedAt: string | null;
};

export interface JobDescriptionParser {
  parseFromText(text: string): Promise<JobDescriptionParseResult>;
}
