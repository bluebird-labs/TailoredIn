import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { GenerationSettings } from './GenerationSettings.js';

type GenerationPromptProps = {
  id: string;
  generationSettings: GenerationSettings;
  scope: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'generation_prompts' })
export class GenerationPrompt extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => GenerationSettings, { fieldName: 'generation_settings_id' })
  public readonly generationSettings: GenerationSettings;

  @Property({ name: 'scope', type: 'text' })
  public scope: string;

  @Property({ name: 'content', type: 'text' })
  public content: string;

  public constructor(props: GenerationPromptProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.generationSettings = props.generationSettings;
    this.scope = props.scope;
    this.content = props.content;
  }
}
