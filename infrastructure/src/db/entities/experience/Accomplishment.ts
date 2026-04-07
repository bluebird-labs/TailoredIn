import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Experience } from './Experience.js';

type AccomplishmentProps = {
  id: string;
  experience: Experience;
  title: string;
  narrative: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'accomplishments' })
export class Accomplishment extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Experience, { name: 'experience_id' })
  public readonly experience: Experience;

  @Property({ name: 'title', type: 'text' })
  public title: string;

  @Property({ name: 'narrative', type: 'text' })
  public narrative: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: AccomplishmentProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.experience = props.experience;
    this.title = props.title;
    this.narrative = props.narrative;
    this.ordinal = props.ordinal;
  }
}
