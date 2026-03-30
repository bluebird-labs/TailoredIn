import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property, Unique } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { User } from '../users/User.js';
import { ResumeSkillItem } from './ResumeSkillItem.js';

export type ResumeSkillCategoryProps = {
  id: string;
  user: RefOrEntity<User>;
  categoryName: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeSkillCategoryCreateProps = Omit<ResumeSkillCategoryProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_skill_categories' })
@Unique({ properties: ['user', 'categoryName'], name: 'resume_skill_categories_user_id_category_name_key' })
export class ResumeSkillCategory extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => User, { lazy: true, name: 'user_id' })
  public readonly user: RefOrEntity<User>;

  @Property({ name: 'category_name', type: 'text' })
  public categoryName: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => ResumeSkillItem,
    item => item.category,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly items: Collection<ResumeSkillItem> = new Collection<ResumeSkillItem>(this);

  public constructor(props: ResumeSkillCategoryProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.user = props.user;
    this.categoryName = props.categoryName;
    this.ordinal = props.ordinal;
  }

  public static create(props: ResumeSkillCategoryCreateProps): ResumeSkillCategory {
    const now = new Date();
    return new ResumeSkillCategory({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
