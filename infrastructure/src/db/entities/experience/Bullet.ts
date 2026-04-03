import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Tag } from '../tag/Tag.js';
import { Experience } from './Experience.js';

type BulletProps = {
  id: string;
  experience: RefOrEntity<Experience>;
  content: string;
  verboseDescription: string | null;
  status: string;
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

  @Property({ name: 'verbose_description', type: 'text', nullable: true })
  public verboseDescription: string | null;

  @Property({ name: 'status', type: 'text', default: 'active' })
  public status: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @ManyToMany(() => Tag, undefined, {
    pivotTable: 'bullet_tags',
    joinColumn: 'bullet_id',
    inverseJoinColumn: 'tag_id'
  })
  public tags = new Collection<Tag>(this);

  public constructor(props: BulletProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.experience = props.experience;
    this.content = props.content;
    this.verboseDescription = props.verboseDescription;
    this.status = props.status;
    this.ordinal = props.ordinal;
  }
}
