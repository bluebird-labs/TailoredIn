import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Entity as DomainEntity } from '../Entity.js';
import { GenerationPromptIdType } from '../orm-types/GenerationPromptIdType.js';
import { GenerationPromptId } from '../value-objects/GenerationPromptId.js';
import type { GenerationScope } from '../value-objects/GenerationScope.js';
import { GenerationSettings } from './GenerationSettings.js';

export type GenerationPromptCreateProps = {
  generationSettingsId: string;
  scope: GenerationScope;
  content: string;
};

@Entity({ tableName: 'generation_prompts' })
export class GenerationPrompt extends DomainEntity<GenerationPromptId> {
  @PrimaryKey({ type: GenerationPromptIdType, fieldName: 'id' })
  public declare readonly id: GenerationPromptId;

  @ManyToOne(() => GenerationSettings, { fieldName: 'generation_settings_id', mapToPk: true })
  public readonly generationSettingsId: string;

  @Property({ fieldName: 'scope', type: 'text' })
  public readonly scope: GenerationScope;

  @Property({ fieldName: 'content', type: 'text' })
  public content: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: GenerationPromptId;
    generationSettingsId: string;
    scope: GenerationScope;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.generationSettingsId = props.generationSettingsId;
    this.scope = props.scope;
    this.content = props.content;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  public static create(props: GenerationPromptCreateProps): GenerationPrompt {
    const now = new Date();
    return new GenerationPrompt({
      id: GenerationPromptId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
