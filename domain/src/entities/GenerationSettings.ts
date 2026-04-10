import { Collection } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import { GenerationSettingsIdType } from '../orm-types/GenerationSettingsIdType.js';
import type { GenerationScope } from '../value-objects/GenerationScope.js';
import { GenerationSettingsId } from '../value-objects/GenerationSettingsId.js';
import { ModelTier } from '../value-objects/ModelTier.js';
import { GenerationPrompt } from './GenerationPrompt.js';
import { Profile } from './Profile.js';

export type GenerationSettingsCreateProps = {
  profileId: string;
  modelTier: ModelTier;
  bulletMin: number;
  bulletMax: number;
};

@Entity({ tableName: 'generation_settings' })
export class GenerationSettings extends AggregateRoot<GenerationSettingsId> {
  @PrimaryKey({ type: GenerationSettingsIdType, fieldName: 'id' })
  public readonly id!: GenerationSettingsId;

  // @ts-expect-error — mapToPk narrows to string but decorator expects entity type
  @ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })
  public readonly profileId: string;

  @Property({ fieldName: 'model_tier', type: 'text' })
  public modelTier: ModelTier;

  @Property({ fieldName: 'bullet_min', type: 'integer' })
  public bulletMin: number;

  @Property({ fieldName: 'bullet_max', type: 'integer' })
  public bulletMax: number;

  @OneToMany(
    () => GenerationPrompt,
    p => p.generationSettingsId,
    { orphanRemoval: true }
  )
  public readonly prompts = new Collection<GenerationPrompt>(this);

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: GenerationSettingsId;
    profileId: string;
    modelTier: ModelTier;
    bulletMin: number;
    bulletMax: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.id = props.id;
    this.profileId = props.profileId;
    this.modelTier = props.modelTier;
    this.bulletMin = props.bulletMin;
    this.bulletMax = props.bulletMax;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateModelTier(tier: ModelTier): void {
    this.modelTier = tier;
    this.updatedAt = new Date();
  }

  public updateBulletRange(min: number, max: number): void {
    if (min <= 0) throw new Error('bulletMin must be greater than 0');
    if (max < min) throw new Error('bulletMax must be greater than or equal to bulletMin');
    this.bulletMin = min;
    this.bulletMax = max;
    this.updatedAt = new Date();
  }

  public setPrompt(scope: GenerationScope, content: string): void {
    const existing = this.prompts.getItems().find(p => p.scope === scope);
    if (existing) {
      existing.updateContent(content);
    } else {
      this.prompts.add(GenerationPrompt.create({ generationSettingsId: this.id.value, scope, content }));
    }
    this.updatedAt = new Date();
  }

  public removePrompt(scope: GenerationScope): void {
    const index = this.prompts.getItems().findIndex(p => p.scope === scope);
    if (index !== -1) {
      const item = this.prompts.getItems()[index];
      this.prompts.remove(item);
      this.updatedAt = new Date();
    }
  }

  public getPrompt(scope: GenerationScope): string | null {
    return this.prompts.getItems().find(p => p.scope === scope)?.content ?? null;
  }

  public static createDefault(profileId: string): GenerationSettings {
    const now = new Date();
    return new GenerationSettings({
      id: GenerationSettingsId.generate(),
      profileId,
      modelTier: ModelTier.BALANCED,
      bulletMin: 2,
      bulletMax: 5,
      createdAt: now,
      updatedAt: now
    });
  }
}
