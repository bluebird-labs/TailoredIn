import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Experience } from './Experience.js';

type ExperienceGenerationOverrideProps = {
  id: string;
  experience: Experience;
  bulletMin: number;
  bulletMax: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'experience_generation_overrides' })
export class ExperienceGenerationOverride extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Experience, { fieldName: 'experience_id' })
  public readonly experience: Experience;

  @Property({ name: 'bullet_min', type: 'integer' })
  public bulletMin: number;

  @Property({ name: 'bullet_max', type: 'integer' })
  public bulletMax: number;

  public constructor(props: ExperienceGenerationOverrideProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.experience = props.experience;
    this.bulletMin = props.bulletMin;
    this.bulletMax = props.bulletMax;
  }
}
