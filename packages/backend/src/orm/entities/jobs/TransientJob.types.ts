import { BaseEntityProps } from '../../BaseEntity.types';
import { JobStatus } from './JobStatus';

export type TransientJobProps = {
  status: JobStatus;
  applyLink: string | null;
  linkedinId: string;
  title: string;
  linkedinLink: string;
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
} & BaseEntityProps;

export type TransientJobCreateProps = Omit<TransientJobProps, 'createdAt' | 'updatedAt'>;
