import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumePosition } from '../resume/ResumePosition.js';
import { Archetype } from './Archetype.js';
import { ArchetypePositionBullet } from './ArchetypePositionBullet.js';

export type ArchetypePositionProps = {
  id: string;
  archetype: RefOrEntity<Archetype>;
  resumePosition: RefOrEntity<ResumePosition>;
  jobTitle: string | null;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string | null;
  endDate: string | null;
  roleSummary: string | null;
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

  @ManyToOne(() => ResumePosition, { lazy: true, name: 'resume_position_id' })
  public readonly resumePosition: RefOrEntity<ResumePosition>;

  @Property({ name: 'job_title', type: 'text', nullable: true })
  public jobTitle: string | null;

  @Property({ name: 'display_company_name', type: 'text' })
  public displayCompanyName: string;

  @Property({ name: 'location_label', type: 'text' })
  public locationLabel: string;

  @Property({ name: 'start_date', type: 'text', nullable: true })
  public startDate: string | null;

  @Property({ name: 'end_date', type: 'text', nullable: true })
  public endDate: string | null;

  @Property({ name: 'role_summary', type: 'text', nullable: true })
  public roleSummary: string | null;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => ArchetypePositionBullet,
    apb => apb.position,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly bullets: Collection<ArchetypePositionBullet> = new Collection<ArchetypePositionBullet>(this);

  public constructor(props: ArchetypePositionProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.archetype = props.archetype;
    this.resumePosition = props.resumePosition;
    this.jobTitle = props.jobTitle;
    this.displayCompanyName = props.displayCompanyName;
    this.locationLabel = props.locationLabel;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.roleSummary = props.roleSummary;
    this.ordinal = props.ordinal;
  }

  public static create(props: ArchetypePositionCreateProps): ArchetypePosition {
    const now = new Date();
    return new ArchetypePosition({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
