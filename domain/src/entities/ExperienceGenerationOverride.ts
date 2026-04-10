import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AggregateRoot } from '../AggregateRoot.js';
import { ExperienceGenerationOverrideIdType } from '../orm-types/ExperienceGenerationOverrideIdType.js';
import { ExperienceGenerationOverrideId } from '../value-objects/ExperienceGenerationOverrideId.js';
import { Experience } from './Experience.js';

export type ExperienceGenerationOverrideCreateProps = {
  experienceId: string;
  bulletMin: number;
  bulletMax: number;
};

@Entity({ tableName: 'experience_generation_overrides' })
export class ExperienceGenerationOverride extends AggregateRoot<ExperienceGenerationOverrideId> {
  @PrimaryKey({ type: ExperienceGenerationOverrideIdType, fieldName: 'id' })
  public declare readonly id: ExperienceGenerationOverrideId;

  @ManyToOne(() => Experience, { fieldName: 'experience_id', mapToPk: true })
  public readonly experienceId: string;

  @Property({ fieldName: 'bullet_min', type: 'integer' })
  public bulletMin: number;

  @Property({ fieldName: 'bullet_max', type: 'integer' })
  public bulletMax: number;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: ExperienceGenerationOverrideId;
    experienceId: string;
    bulletMin: number;
    bulletMax: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.experienceId = props.experienceId;
    this.bulletMin = props.bulletMin;
    this.bulletMax = props.bulletMax;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateBulletRange(min: number, max: number): void {
    if (min <= 0) throw new Error('bulletMin must be greater than 0');
    if (max < min) throw new Error('bulletMax must be greater than or equal to bulletMin');
    this.bulletMin = min;
    this.bulletMax = max;
    this.updatedAt = new Date();
  }

  public static create(props: ExperienceGenerationOverrideCreateProps): ExperienceGenerationOverride {
    const now = new Date();
    return new ExperienceGenerationOverride({
      id: ExperienceGenerationOverrideId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
