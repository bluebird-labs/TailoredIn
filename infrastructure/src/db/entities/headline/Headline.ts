import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Tag } from '../tag/Tag.js';

@Entity({ tableName: 'headlines' })
export class Headline extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ name: 'label', type: 'text' })
  public label: string;

  @Property({ name: 'summary_text', type: 'text' })
  public summaryText: string;

  @Property({ name: 'status', type: 'text', default: 'active' })
  public status: string;

  @ManyToMany(() => Tag, undefined, {
    pivotTable: 'headline_tags',
    joinColumn: 'headline_id',
    inverseJoinColumn: 'tag_id'
  })
  public roleTags = new Collection<Tag>(this);

  public constructor(props: {
    id: string;
    profileId: string;
    label: string;
    summaryText: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profileId = props.profileId;
    this.label = props.label;
    this.summaryText = props.summaryText;
    this.status = props.status;
  }
}
