import { Entity, Enum, ManyToOne } from '@mikro-orm/core';
import { Job } from './Job';
import { BaseEntity } from '../../BaseEntity';
import { JobStatusUpdateCreateProps, JobStatusUpdateProps } from './JobStatusUpdate.types';
import { JobStatus } from './JobStatus';
import { generateUuid, RefOrEntity, UuidPrimaryKey } from '../../helpers';

@Entity({ tableName: 'job_status_updates' })
export class JobStatusUpdate extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public id: string;

  @ManyToOne(() => Job, {
    lazy: true,
    ref: true,
    name: 'job_id'
  })
  public job: RefOrEntity<Job>;

  @Enum({ name: 'status', items: () => JobStatus, nativeEnumName: 'job_status' })
  public status: JobStatus;

  protected constructor(props: JobStatusUpdateProps) {
    super(props);
    this.id = props.id;
    this.job = props.job;
    this.status = props.status;
  }

  public static create(props: JobStatusUpdateCreateProps) {
    return new JobStatusUpdate({
      ...props,
      id: generateUuid(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
