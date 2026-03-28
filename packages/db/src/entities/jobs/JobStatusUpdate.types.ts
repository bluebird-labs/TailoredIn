import type { BaseEntityProps } from '../../BaseEntity.types.js';
import type { RefOrEntity } from '../../helpers.js';
import type { Job } from './Job.js';
import type { JobStatus } from './JobStatus.js';

export type JobStatusUpdateProps = {
  id: string;
  job: RefOrEntity<Job>;
  status: JobStatus;
} & BaseEntityProps;

export type JobStatusUpdateCreateProps = Omit<JobStatusUpdateProps, 'id' | 'createdAt' | 'updatedAt'>;
