import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeCompany } from '../resume/ResumeCompany.js';
import { Archetype } from './Archetype.js';
import { ArchetypePositionBullet } from './ArchetypePositionBullet.js';

export type ArchetypePositionProps = {
  id: string;
  archetype: RefOrEntity<Archetype>;
  resumeCompany: RefOrEntity<ResumeCompany>;
  jobTitle: string;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string;
  endDate: string;
  roleSummary: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ArchetypePositionCreateProps = Omit<ArchetypePositionProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'archetype_positions' })
export class ArchetypePosition extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Archetype, { lazy: true, name: 'archetype_id' })
  public readonly archetype: RefOrEntity<Archetype>;

  @ManyToOne(() => ResumeCompany, { lazy: true, name: 'resume_company_id' })
  public readonly resumeCompany: RefOrEntity<ResumeCompany>;

  @Property({ name: 'job_title', type: 'text' })
  public jobTitle: string;

  @Property({ name: 'display_company_name', type: 'text' })
  public displayCompanyName: string;

  @Property({ name: 'location_label', type: 'text' })
  public locationLabel: string;

  @Property({ name: 'start_date', type: 'text' })
  public startDate: string;

  @Property({ name: 'end_date', type: 'text' })
  public endDate: string;

  @Property({ name: 'role_summary', type: 'text' })
  public roleSummary: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => ArchetypePositionBullet,
    apb => apb.position,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly bullets: Collection<ArchetypePositionBullet> = new Collection<ArchetypePositionBullet>(this);

  constructor(props: ArchetypePositionProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.archetype = props.archetype;
    this.resumeCompany = props.resumeCompany;
    this.jobTitle = props.jobTitle;
    this.displayCompanyName = props.displayCompanyName;
    this.locationLabel = props.locationLabel;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.roleSummary = props.roleSummary;
    this.ordinal = props.ordinal;
  }

  static create(props: ArchetypePositionCreateProps): ArchetypePosition {
    const now = new Date();
    return new ArchetypePosition({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
