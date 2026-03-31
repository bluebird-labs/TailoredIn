import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeBullet } from './ResumeBullet.js';
import { ResumeCompany } from './ResumeCompany.js';

export type ResumePositionProps = {
  id: string;
  resumeCompany: RefOrEntity<ResumeCompany>;
  title: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumePositionCreateProps = Omit<ResumePositionProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_positions' })
export class ResumePosition extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => ResumeCompany, { lazy: true, name: 'resume_company_id' })
  public readonly resumeCompany: RefOrEntity<ResumeCompany>;

  @Property({ name: 'title', type: 'text' })
  public title: string;

  @Property({ name: 'start_date', type: 'text' })
  public startDate: string;

  @Property({ name: 'end_date', type: 'text' })
  public endDate: string;

  @Property({ name: 'summary', type: 'text', nullable: true })
  public summary: string | null;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => ResumeBullet,
    bullet => bullet.resumePosition,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly bullets: Collection<ResumeBullet> = new Collection<ResumeBullet>(this);

  public constructor(props: ResumePositionProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.resumeCompany = props.resumeCompany;
    this.title = props.title;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.ordinal = props.ordinal;
  }

  public static create(props: ResumePositionCreateProps): ResumePosition {
    const now = new Date();
    return new ResumePosition({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
