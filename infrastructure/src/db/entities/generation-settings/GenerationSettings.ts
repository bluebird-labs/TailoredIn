import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Profile } from '../profile/Profile.js';
import { GenerationPrompt } from './GenerationPrompt.js';

type GenerationSettingsProps = {
  id: string;
  profile: Profile;
  modelTier: string;
  bulletMin: number;
  bulletMax: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'generation_settings' })
export class GenerationSettings extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Profile, { fieldName: 'profile_id' })
  public readonly profile: Profile;

  @Property({ name: 'model_tier', type: 'text' })
  public modelTier: string;

  @Property({ name: 'bullet_min', type: 'integer' })
  public bulletMin: number;

  @Property({ name: 'bullet_max', type: 'integer' })
  public bulletMax: number;

  @OneToMany(
    () => GenerationPrompt,
    prompt => prompt.generationSettings,
    { lazy: true }
  )
  public readonly prompts: Collection<GenerationPrompt> = new Collection<GenerationPrompt>(this);

  public constructor(props: GenerationSettingsProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.modelTier = props.modelTier;
    this.bulletMin = props.bulletMin;
    this.bulletMax = props.bulletMax;
  }
}
