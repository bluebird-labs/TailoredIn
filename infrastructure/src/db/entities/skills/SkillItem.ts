import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { SkillCategory } from './SkillCategory.js';

export type SkillItemProps = {
  id: string;
  category: RefOrEntity<SkillCategory>;
  name: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'skill_items' })
export class SkillItem extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => SkillCategory, { lazy: true, name: 'skill_category_id' })
  public readonly category: RefOrEntity<SkillCategory>;

  @Property({ name: 'name', type: 'text' })
  public name: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: SkillItemProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.category = props.category;
    this.name = props.name;
    this.ordinal = props.ordinal;
  }
}
