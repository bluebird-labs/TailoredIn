import { Collection, EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Company } from '../companies/Company.js';
import { JobOrmRepository } from './JobOrmRepository.js';
import { JobStatus } from './JobStatus.js';
import { JobStatusUpdate } from './JobStatusUpdate.js';

export type JobProps = {
  id: string;
  companyId?: string;
  company: RefOrEntity<Company>;
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
  createdAt: Date;
  updatedAt: Date;
};

export type JobCreateProps = Omit<JobProps, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>;

@Entity({ tableName: 'jobs', repository: () => JobOrmRepository })
export class Job extends BaseEntity {
  public [EntityRepositoryType]!: JobOrmRepository;

  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

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
  private descriptionFts: string | null = null;

  @ManyToOne(() => Company, { lazy: true, name: 'company_id' })
  public readonly company: RefOrEntity<Company>;

  @OneToMany(() => JobStatusUpdate, jsu => jsu.job, { lazy: true, orderBy: { createdAt: 'DESC' } })
  public readonly statusUpdates: Collection<JobStatusUpdate> = new Collection<JobStatusUpdate>(this);

  constructor(props: JobProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.company = props.company;
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
  }

  get companyId(): string {
    return this.company.id;
  }

  static create(props: JobCreateProps): Job {
    const now = new Date();
    return new Job({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
