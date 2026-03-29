import { Entity, Enum, Property } from '@mikro-orm/decorators/es';
import { ObjectUtil, type TypeUtil } from '@tailoredin/shared';
import { BaseEntity } from '../../BaseEntity.js';
import { DISCARDED_JOB_STATUSES, IN_PROCESS_JOB_STATUSES, JobStatus } from './JobStatus.js';
import type { TransientJobCreateProps, TransientJobProps } from './TransientJob.types.js';

@Entity({ abstract: true })
export class TransientJob extends BaseEntity {
  @Enum({ name: 'status', items: () => JobStatus, default: JobStatus.NEW, nativeEnumName: 'job_status' })
  public status: JobStatus;

  @Property({ name: 'apply_link', type: 'text', nullable: true })
  public applyLink: string | null;

  @Property({ name: 'linkedin_id', type: 'text', unique: 'jobs_linkedin_id_key' })
  public linkedinId: string;

  @Property({ name: 'title', type: 'text' })
  public title: string;

  @Property({ name: 'linkedin_link', type: 'text' })
  public linkedinLink: string;

  @Property({ name: 'type', type: 'text', nullable: true })
  public type: string | null;

  @Property({ name: 'level', type: 'text', nullable: true })
  public level: string | null;

  @Property({ name: 'remote', type: 'text', nullable: true })
  public remote: string | null;

  @Property({ name: 'posted_at', columnType: 'timestamp(3)', nullable: true })
  public postedAt: Date | null;

  @Property({ name: 'is_repost', type: 'boolean', nullable: true })
  public isRepost: boolean | null;

  @Property({ name: 'location_raw', type: 'text' })
  public locationRaw: string;

  @Property({ name: 'salary_low', type: 'integer', nullable: true })
  public salaryLow: number | null;

  @Property({ name: 'salary_high', type: 'integer', nullable: true })
  public salaryHigh: number | null;

  @Property({ name: 'salary_raw', type: 'text', nullable: true })
  public salaryRaw: string | null;

  @Property({ name: 'description', type: 'text' })
  public description: string;

  @Property({ name: 'description_html', type: 'text' })
  public descriptionHtml: string;

  @Property({ name: 'applicants_count', type: 'integer', nullable: true })
  public applicantsCount: number | null;

  @Property({
    name: 'description_fts',
    type: 'string',
    hidden: true,
    columnType: 'tsvector',
    generated: "to_tsvector('english'::regconfig, description) stored",
    nullable: true,
    index: 'description_fts_idx'
  })
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: MikroORM write-only generated tsvector column
  private descriptionFts: string | null;

  constructor(props: TransientJobProps) {
    super(props);
    this.status = props.status;
    this.applyLink = props.applyLink;
    this.linkedinId = props.linkedinId;
    this.title = props.title;
    this.linkedinLink = props.linkedinLink;
    this.type = props.type;
    this.level = props.level;
    this.remote = props.remote;
    this.postedAt = props.postedAt;
    this.isRepost = props.isRepost;
    this.locationRaw = props.locationRaw;
    this.salaryLow = props.salaryLow;
    this.salaryHigh = props.salaryHigh;
    this.salaryRaw = props.salaryRaw;
    this.description = props.description;
    this.descriptionHtml = props.descriptionHtml;
    this.applicantsCount = props.applicantsCount;
    this.descriptionFts = null;
  }

  public static generate(overrides: TypeUtil.DeepPartial<TransientJobCreateProps> = {}): TransientJob {
    return TransientJob.create(TransientJob.generateCreateProps(overrides));
  }

  public static generateCreateProps(
    overrides: TypeUtil.DeepPartial<TransientJobCreateProps> = {}
  ): TransientJobCreateProps {
    return ObjectUtil.mergeWithOverrides(
      {
        status: JobStatus.NEW,
        applyLink: null,
        linkedinId: '1234567890',
        title: 'Software Engineer',
        linkedinLink: 'https://www.linkedin.com/jobs/view/1234567890',
        type: null,
        level: null,
        remote: null,
        postedAt: null,
        isRepost: null,
        locationRaw: 'San Francisco, CA',
        salaryLow: null,
        salaryHigh: null,
        salaryRaw: null,
        description: 'Job description',
        descriptionHtml: 'Job description',
        applicantsCount: null
      },
      overrides
    );
  }

  public static create(props: TransientJobCreateProps): TransientJob {
    return new TransientJob({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  public isWithinSalaryRange(min: number, target: number, ifNull = true): boolean {
    if (this.salaryLow === null && this.salaryHigh === null) {
      return ifNull;
    }

    const salaryLow = this.salaryLow ?? this.salaryHigh!;
    const salaryHigh = this.salaryHigh ?? this.salaryLow!;

    if (salaryHigh < min) {
      return false;
    }

    return (salaryLow + salaryHigh) / 2 >= target;
  }

  public toProps(): TransientJobProps {
    return {
      status: this.status,
      applyLink: this.applyLink,
      linkedinId: this.linkedinId,
      title: this.title,
      linkedinLink: this.linkedinLink,
      type: this.type,
      level: this.level,
      remote: this.remote,
      postedAt: this.postedAt,
      isRepost: this.isRepost,
      locationRaw: this.locationRaw,
      salaryLow: this.salaryLow,
      salaryHigh: this.salaryHigh,
      salaryRaw: this.salaryRaw,
      description: this.description,
      descriptionHtml: this.descriptionHtml,
      applicantsCount: this.applicantsCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  public isInProcess(): boolean {
    return IN_PROCESS_JOB_STATUSES.has(this.status);
  }

  public isDiscarded(): boolean {
    return DISCARDED_JOB_STATUSES.has(this.status);
  }

  public isNew(): boolean {
    return this.status === JobStatus.NEW;
  }

  public setApplyLink(value: string) {
    this.applyLink = value;
    this.updatedAt = new Date();
  }

  public setInitialStatus(status: JobStatus) {
    this.status = status;
  }
}
