import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeEducation } from '../resume/ResumeEducation.js';
import { Archetype } from './Archetype.js';

export type ArchetypeEducationProps = {
  id: string;
  archetype: RefOrEntity<Archetype>;
  education: RefOrEntity<ResumeEducation>;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ArchetypeEducationCreateProps = Omit<ArchetypeEducationProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'archetype_education' })
@Unique({ properties: ['archetype', 'education'], name: 'archetype_education_archetype_id_education_id_key' })
export class ArchetypeEducation extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Archetype, { lazy: true, name: 'archetype_id' })
  public readonly archetype: RefOrEntity<Archetype>;

  @ManyToOne(() => ResumeEducation, { lazy: true, name: 'education_id' })
  public readonly education: RefOrEntity<ResumeEducation>;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  constructor(props: ArchetypeEducationProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.archetype = props.archetype;
    this.education = props.education;
    this.ordinal = props.ordinal;
  }

  static create(props: ArchetypeEducationCreateProps): ArchetypeEducation {
    const now = new Date();
    return new ArchetypeEducation({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
