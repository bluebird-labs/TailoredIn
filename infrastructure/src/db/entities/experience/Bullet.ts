import { Collection, type Ref } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Tag } from '../tag/Tag.js';
import { BulletVariant } from './BulletVariant.js';
import { Experience } from './Experience.js';

export type BulletProps = {
  id: string;
  experience: RefOrEntity<Experience>;
  content: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'bullets' })
export class Bullet extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Experience, { lazy: true, name: 'experience_id' })
  public readonly experience: RefOrEntity<Experience>;

  @Property({ name: 'content', type: 'text' })
  public content: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @ManyToMany(() => Tag, undefined, {
    pivotTable: 'bullet_tags',
    joinColumn: 'bullet_id',
    inverseJoinColumn: 'tag_id'
  })
  public tags = new Collection<Tag>(this);

  @OneToMany(
    () => BulletVariant,
    variant => variant.bullet,
    { lazy: true, orderBy: { createdAt: 'ASC' } }
  )
  public readonly variants: Collection<BulletVariant> = new Collection<BulletVariant>(this);

  public constructor(props: BulletProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.experience = props.experience;
    this.content = props.content;
    this.ordinal = props.ordinal;
  }
}
