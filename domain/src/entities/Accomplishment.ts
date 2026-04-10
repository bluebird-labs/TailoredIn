import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Entity as DomainEntity } from '../Entity.js';
import { AccomplishmentIdType } from '../orm-types/AccomplishmentIdType.js';
import { AccomplishmentId } from '../value-objects/AccomplishmentId.js';
import { Experience } from './Experience.js';

export type AccomplishmentCreateProps = {
  experienceId: string;
  title: string;
  narrative: string;
  ordinal: number;
};

@Entity({ tableName: 'accomplishments' })
export class Accomplishment extends DomainEntity<AccomplishmentId> {
  @PrimaryKey({ type: AccomplishmentIdType, fieldName: 'id' })
  public declare readonly id: AccomplishmentId;

  @ManyToOne(() => Experience, { fieldName: 'experience_id', mapToPk: true })
  public readonly experienceId: string;

  @Property({ fieldName: 'title', type: 'text' })
  public title: string;

  @Property({ fieldName: 'narrative', type: 'text' })
  public narrative: string;

  @Property({ fieldName: 'ordinal', type: 'integer' })
  public ordinal: number;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: AccomplishmentId;
    experienceId: string;
    title: string;
    narrative: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.experienceId = props.experienceId;
    this.title = props.title;
    this.narrative = props.narrative;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public update(props: Partial<{ title: string; narrative: string; ordinal: number }>): void {
    if (props.title !== undefined) this.title = props.title;
    if (props.narrative !== undefined) this.narrative = props.narrative;
    if (props.ordinal !== undefined) this.ordinal = props.ordinal;
    this.updatedAt = new Date();
  }

  public static create(props: AccomplishmentCreateProps): Accomplishment {
    const now = new Date();
    return new Accomplishment({
      id: AccomplishmentId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
