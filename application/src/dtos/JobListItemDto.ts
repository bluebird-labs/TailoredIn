import type { JobStatus } from '@tailoredin/domain';

export type JobListItemDto = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  status: JobStatus;
  postedAt: string | null;
  locationRaw: string;
  salaryRaw: string | null;
  expertScore: number;
  totalSkillScore: number;
  salaryScore: number | null;
};

