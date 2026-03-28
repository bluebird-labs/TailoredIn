import { Job } from './Job';
import { BaseEntityProps } from '../../BaseEntity.types';
import { JobStatus } from './JobStatus';
import { RefOrEntity } from '../../helpers';

export type JobStatusUpdateProps = {
  id: string;
  job: RefOrEntity<Job>;
  status: JobStatus;
} & BaseEntityProps;

export type JobStatusUpdateCreateProps = Omit<JobStatusUpdateProps, 'id' | 'createdAt' | 'updatedAt'>;
