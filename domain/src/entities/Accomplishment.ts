import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { Entity as DomainEntity } from '../Entity.js';
import { ValidationError } from '../ValidationError.js';
import { Experience } from './Experience.js';

export type AccomplishmentCreateProps = {
  experienceId: string;
  title: string;
  narrative: string;
  ordinal: number;
};

@Entity({ tableName: 'accomplishments' })
export class Accomplishment extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  // @ts-expect-error — MikroORM decorator types don't support mapToPk with string PKs; required for @OneToMany on Experience
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
    id: string;
    experienceId: string;
    title: string;
    narrative: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.title || props.title.length > 500)
      throw new ValidationError('title', 'must be between 1 and 500 characters');
    if (!props.narrative || props.narrative.length > 5000)
      throw new ValidationError('narrative', 'must be between 1 and 5000 characters');
    this.id = props.id;
    this.experienceId = props.experienceId;
    this.title = props.title;
    this.narrative = props.narrative;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public update(props: Partial<{ title: string; narrative: string; ordinal: number }>): void {
    if (props.title !== undefined) {
      if (!props.title || props.title.length > 500)
        throw new ValidationError('title', 'must be between 1 and 500 characters');
      this.title = props.title;
    }
    if (props.narrative !== undefined) {
      if (!props.narrative || props.narrative.length > 5000)
        throw new ValidationError('narrative', 'must be between 1 and 5000 characters');
      this.narrative = props.narrative;
    }
    if (props.ordinal !== undefined) this.ordinal = props.ordinal;
    this.updatedAt = new Date();
  }

  public static create(props: AccomplishmentCreateProps): Accomplishment {
    const now = new Date();
    return new Accomplishment({
      id: crypto.randomUUID(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
