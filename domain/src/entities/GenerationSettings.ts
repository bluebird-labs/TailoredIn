import { AggregateRoot } from '../AggregateRoot.js';
import type { GenerationScope } from '../value-objects/GenerationScope.js';
import { GenerationSettingsId } from '../value-objects/GenerationSettingsId.js';
import { ModelTier } from '../value-objects/ModelTier.js';
import { GenerationPrompt } from './GenerationPrompt.js';

export type GenerationSettingsCreateProps = {
  profileId: string;
  modelTier: ModelTier;
  bulletMin: number;
  bulletMax: number;
  prompts: GenerationPrompt[];
};

export class GenerationSettings extends AggregateRoot<GenerationSettingsId> {
  public readonly profileId: string;
  public modelTier: ModelTier;
  public bulletMin: number;
  public bulletMax: number;
  public readonly prompts: GenerationPrompt[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: GenerationSettingsId;
    profileId: string;
    modelTier: ModelTier;
    bulletMin: number;
    bulletMax: number;
    prompts: GenerationPrompt[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.modelTier = props.modelTier;
    this.bulletMin = props.bulletMin;
    this.bulletMax = props.bulletMax;
    this.prompts = props.prompts;
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
    const existing = this.prompts.find(p => p.scope === scope);
    if (existing) {
      existing.updateContent(content);
    } else {
      this.prompts.push(GenerationPrompt.create({ scope, content }));
    }
    this.updatedAt = new Date();
  }

  public removePrompt(scope: GenerationScope): void {
    const index = this.prompts.findIndex(p => p.scope === scope);
    if (index !== -1) {
      this.prompts.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  public getPrompt(scope: GenerationScope): string | null {
    return this.prompts.find(p => p.scope === scope)?.content ?? null;
  }

  public static createDefault(profileId: string): GenerationSettings {
    const now = new Date();
    return new GenerationSettings({
      id: GenerationSettingsId.generate(),
      profileId,
      modelTier: ModelTier.BALANCED,
      bulletMin: 2,
      bulletMax: 5,
      prompts: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
