import { ArrayType, Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property, Unique } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeHeadline } from '../resume/ResumeHeadline.js';
import { User } from '../users/User.js';
import { ArchetypeEducation } from './ArchetypeEducation.js';
import { ArchetypePosition } from './ArchetypePosition.js';
import { ArchetypeSkillCategory } from './ArchetypeSkillCategory.js';
import { ArchetypeSkillItem } from './ArchetypeSkillItem.js';

export type ArchetypeProps = {
  id: string;
  user: RefOrEntity<User>;
  archetypeKey: string;
  archetypeLabel: string;
  archetypeDescription: string | null;
  headline: RefOrEntity<ResumeHeadline>;
  socialNetworks: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ArchetypeCreateProps = Omit<ArchetypeProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'archetypes' })
@Unique({ properties: ['user', 'archetypeKey'], name: 'archetypes_user_id_archetype_key_key' })
export class Archetype extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => User, { lazy: true, name: 'user_id' })
  public readonly user: RefOrEntity<User>;

  @Property({ name: 'archetype_key', type: 'text' })
  public archetypeKey: string;

  @Property({ name: 'archetype_label', type: 'text' })
  public archetypeLabel: string;

  @Property({ name: 'archetype_description', type: 'text', nullable: true })
  public archetypeDescription: string | null;

  @ManyToOne(() => ResumeHeadline, { lazy: true, name: 'headline_id' })
  public readonly headline: RefOrEntity<ResumeHeadline>;

  @Property({ name: 'social_networks', type: new ArrayType(v => v) })
  public socialNetworks: string[];

  @OneToMany(
    () => ArchetypeEducation,
    ae => ae.archetype,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly education: Collection<ArchetypeEducation> = new Collection<ArchetypeEducation>(this);

  @OneToMany(
    () => ArchetypeSkillCategory,
    asc => asc.archetype,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly skillCategories: Collection<ArchetypeSkillCategory> = new Collection<ArchetypeSkillCategory>(this);

  @OneToMany(
    () => ArchetypeSkillItem,
    asi => asi.archetype,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly skillItems: Collection<ArchetypeSkillItem> = new Collection<ArchetypeSkillItem>(this);

  @OneToMany(
    () => ArchetypePosition,
    ap => ap.archetype,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly positions: Collection<ArchetypePosition> = new Collection<ArchetypePosition>(this);

  public constructor(props: ArchetypeProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.user = props.user;
    this.archetypeKey = props.archetypeKey;
    this.archetypeLabel = props.archetypeLabel;
    this.archetypeDescription = props.archetypeDescription;
    this.headline = props.headline;
    this.socialNetworks = props.socialNetworks;
  }

  public static create(props: ArchetypeCreateProps): Archetype {
    const now = new Date();
    return new Archetype({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
