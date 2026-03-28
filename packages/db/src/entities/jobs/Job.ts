import { Collection, Entity, EntityRepositoryType, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { JobRepository } from './JobRepository.js';
import { JobStatusUpdate } from './JobStatusUpdate.js';
import { TransientJob } from './TransientJob.js';
import { TransientJobCreateProps } from './TransientJob.types.js';
import { JobCreateProps, JobProps, JobScoresProps } from './Job.types.js';
import { JobStatus } from './JobStatus.js';
import { Company } from '../companies/Company.js';
import { TypeUtil } from '@tailoredin/shared';
import { generateUuid, RefOrEntity, UuidPrimaryKey } from '../../helpers.js';

@Entity({ tableName: 'jobs', repository: () => JobRepository })
export class Job extends TransientJob {
  public readonly [EntityRepositoryType]!: JobRepository;

  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @OneToMany(() => JobStatusUpdate, jobStatusUpdate => jobStatusUpdate.job, {
    lazy: true,
    orderBy: {
      createdAt: 'DESC'
    }
  })
  public readonly statusUpdates: Collection<JobStatusUpdate> = new Collection<JobStatusUpdate>(this);

  @ManyToOne(() => Company, {
    lazy: true,
    name: 'company_id'
  })
  public readonly company: RefOrEntity<Company>;

  @Property({ persist: false, nullable: true })
  public scores: Readonly<JobScoresProps> | null;

  protected constructor(props: JobProps) {
    super(props);
    this.id = props.id;
    this.company = props.company;
    this.statusUpdates = props.statusUpdates ?? new Collection<JobStatusUpdate>(this);
    this.scores = props.scores ?? null;
  }

  public get companyId() {
    return this.company.id;
  }

  public score(scores: JobScoresProps) {
    this.scores = scores;
  }

  public static generate(overrides: TypeUtil.DeepPartialWithRequired<JobCreateProps, 'company'>): Job {
    return Job.create(Job.generateCreateProps(overrides));
  }

  public static generateCreateProps(
    overrides: TypeUtil.DeepPartialWithRequired<JobCreateProps, 'company'>
  ): JobCreateProps {
    return {
      ...TransientJob.generateCreateProps(overrides),
      company: overrides.company
    };
  }

  public static createTransient(props: TransientJobCreateProps): TransientJob {
    return TransientJob.create(props);
  }

  public static create(props: JobCreateProps): Job {
    return new Job({
      ...props,
      id: generateUuid(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  public changeStatus(newStatus: JobStatus) {
    if (this.status === newStatus) {
      return false;
    }

    this.status = newStatus;
    this.updatedAt = new Date();
    this.statusUpdates.add(
      JobStatusUpdate.create({
        job: this,
        status: newStatus
      })
    );

    return true;
  }

  public retire() {
    return this.changeStatus(JobStatus.RETIRED);
  }

  public isRemote() {
    return this.remote === 'remote';
  }

  public hasMoreApplicantsThan(number: number, ifNull = false): boolean {
    if (this.applicantsCount === null) {
      return ifNull;
    }
    return this.applicantsCount >= number;
  }

  public hasLessApplicantsThan(number: number, ifNull = true): boolean {
    if (this.applicantsCount === null) {
      return ifNull;
    }

    return this.applicantsCount <= number;
  }
}
