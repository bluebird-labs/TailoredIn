import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeSkillCategory } from '../resume/ResumeSkillCategory.js';
import { Archetype } from './Archetype.js';

export type ArchetypeSkillCategoryProps = {
  id: string;
  archetype: RefOrEntity<Archetype>;
  category: RefOrEntity<ResumeSkillCategory>;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ArchetypeSkillCategoryCreateProps = Omit<ArchetypeSkillCategoryProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'archetype_skill_categories' })
@Unique({ properties: ['archetype', 'category'], name: 'archetype_skill_categories_archetype_id_category_id_key' })
export class ArchetypeSkillCategory extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Archetype, { lazy: true, name: 'archetype_id' })
  public readonly archetype: RefOrEntity<Archetype>;

  @ManyToOne(() => ResumeSkillCategory, { lazy: true, name: 'category_id' })
  public readonly category: RefOrEntity<ResumeSkillCategory>;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: ArchetypeSkillCategoryProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.archetype = props.archetype;
    this.category = props.category;
    this.ordinal = props.ordinal;
  }

  public static create(props: ArchetypeSkillCategoryCreateProps): ArchetypeSkillCategory {
    const now = new Date();
    return new ArchetypeSkillCategory({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
