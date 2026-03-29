import type { JobStatus } from '@tailoredin/domain-job';
import type { JobScoresDto } from './JobScoresDto.js';

export type JobSummaryDto = {
  id: string;
  status: JobStatus;
  title: string;
  linkedinId: string;
  linkedinLink: string;
  applyLink: string | null;
  type: string | null;
  level: string | null;
  remote: string | null;
  postedAt: Date | null;
  isRepost: boolean | null;
  locationRaw: string;
  salaryLow: number | null;
  salaryHigh: number | null;
  salaryRaw: string | null;
  description: string;
  descriptionHtml: string;
  applicantsCount: number | null;
  companyId: string;
  scores: JobScoresDto | null;
  createdAt: Date;
  updatedAt: Date;
};
