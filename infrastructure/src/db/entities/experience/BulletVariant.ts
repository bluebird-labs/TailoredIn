import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Tag } from '../tag/Tag.js';
import { Bullet } from './Bullet.js';

export type BulletVariantProps = {
  id: string;
  bullet: RefOrEntity<Bullet>;
  text: string;
  angle: string;
  source: string;
  approvalStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'bullet_variants' })
export class BulletVariant extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Bullet, { lazy: true, name: 'bullet_id' })
  public readonly bullet: RefOrEntity<Bullet>;

  @Property({ name: 'text', type: 'text' })
  public text: string;

  @Property({ name: 'angle', type: 'text' })
  public angle: string;

  @Property({ name: 'source', type: 'text' })
  public source: string;

  @Property({ name: 'approval_status', type: 'text' })
  public approvalStatus: string;

  @ManyToMany(() => Tag, undefined, {
    pivotTable: 'bullet_variant_tags',
    joinColumn: 'bullet_variant_id',
    inverseJoinColumn: 'tag_id'
  })
  public tags = new Collection<Tag>(this);

  public constructor(props: BulletVariantProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.bullet = props.bullet;
    this.text = props.text;
    this.angle = props.angle;
    this.source = props.source;
    this.approvalStatus = props.approvalStatus;
  }
}
