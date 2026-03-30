import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeSkillItem } from '../resume/ResumeSkillItem.js';
import { Archetype } from './Archetype.js';

export type ArchetypeSkillItemProps = {
  id: string;
  archetype: RefOrEntity<Archetype>;
  item: RefOrEntity<ResumeSkillItem>;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ArchetypeSkillItemCreateProps = Omit<ArchetypeSkillItemProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'archetype_skill_items' })
@Unique({ properties: ['archetype', 'item'], name: 'archetype_skill_items_archetype_id_item_id_key' })
export class ArchetypeSkillItem extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Archetype, { lazy: true, name: 'archetype_id' })
  public readonly archetype: RefOrEntity<Archetype>;

  @ManyToOne(() => ResumeSkillItem, { lazy: true, name: 'item_id' })
  public readonly item: RefOrEntity<ResumeSkillItem>;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: ArchetypeSkillItemProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.archetype = props.archetype;
    this.item = props.item;
    this.ordinal = props.ordinal;
  }

  public static create(props: ArchetypeSkillItemCreateProps): ArchetypeSkillItem {
    const now = new Date();
    return new ArchetypeSkillItem({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
