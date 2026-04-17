import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Entity as DomainEntity } from '../Entity.js';
import { ValidationError } from '../ValidationError.js';
import type { GenerationScope } from '../value-objects/GenerationScope.js';
import { GenerationSettings } from './GenerationSettings.js';

export type GenerationPromptCreateProps = {
  generationSettingsId: string;
  scope: GenerationScope;
  content: string;
};

@Entity({ tableName: 'generation_prompts' })
export class GenerationPrompt extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

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
    id: string;
    generationSettingsId: string;
    scope: GenerationScope;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.id = props.id;
    this.generationSettingsId = props.generationSettingsId;
    this.scope = props.scope;
    this.content = props.content;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateContent(content: string): void {
    if (!content || content.length > 10000)
      throw new ValidationError('content', 'must be between 1 and 10000 characters');
    this.content = content;
    this.updatedAt = new Date();
  }

  public static create(props: GenerationPromptCreateProps): GenerationPrompt {
    if (!props.content || props.content.length > 10000)
      throw new ValidationError('content', 'must be between 1 and 10000 characters');
    const now = new Date();
    return new GenerationPrompt({
      id: crypto.randomUUID(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
