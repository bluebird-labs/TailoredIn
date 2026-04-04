import { Collection, type Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Profile } from '../profile/Profile.js';
import { SkillItem } from './SkillItem.js';

type SkillCategoryProps = {
  id: string;
  profile: Ref<Profile> | Profile;
  name: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'skill_categories' })
export class SkillCategory extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Profile, { lazy: true, name: 'profile_id' })
  public readonly profile: Ref<Profile> | Profile;

  @Property({ name: 'name', type: 'text' })
  public name: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => SkillItem,
    item => item.category,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly items: Collection<SkillItem> = new Collection<SkillItem>(this);

  public constructor(props: SkillCategoryProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.name = props.name;
    this.ordinal = props.ordinal;
  }
}
