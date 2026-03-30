import { Entity, Enum, ManyToOne } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Job } from './Job.js';
import { JobStatus } from './JobStatus.js';

@Entity({ tableName: 'job_status_updates' })
export class JobStatusUpdate extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public id: string;

  @ManyToOne(() => Job, { lazy: true, ref: true, name: 'job_id' })
  public job: RefOrEntity<Job>;

  @Enum({ name: 'status', items: () => JobStatus, nativeEnumName: 'job_status' })
  public status: JobStatus;

  public constructor(props: {
    id: string;
    job: RefOrEntity<Job>;
    status: JobStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.job = props.job;
    this.status = props.status;
  }

  public static create(props: { job: RefOrEntity<Job>; status: JobStatus }): JobStatusUpdate {
    const now = new Date();
    return new JobStatusUpdate({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
