import { Job } from './Job.js';
import { BaseEntityProps } from '../../BaseEntity.types.js';
import { JobStatus } from './JobStatus.js';
import { RefOrEntity } from '../../helpers.js';

export type JobStatusUpdateProps = {
  id: string;
  job: RefOrEntity<Job>;
  status: JobStatus;
} & BaseEntityProps;

export type JobStatusUpdateCreateProps = Omit<JobStatusUpdateProps, 'id' | 'createdAt' | 'updatedAt'>;
