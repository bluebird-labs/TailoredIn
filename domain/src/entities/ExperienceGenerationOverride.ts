import { AggregateRoot } from '../AggregateRoot.js';
import { ExperienceGenerationOverrideId } from '../value-objects/ExperienceGenerationOverrideId.js';

export type ExperienceGenerationOverrideCreateProps = {
  experienceId: string;
  bulletMin: number;
  bulletMax: number;
};

export class ExperienceGenerationOverride extends AggregateRoot<ExperienceGenerationOverrideId> {
  public readonly experienceId: string;
  public bulletMin: number;
  public bulletMax: number;
  public readonly createdAt: Date;
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
