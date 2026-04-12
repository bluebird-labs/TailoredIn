import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity({ tableName: 'mind_concepts' })
export class MindConceptEntity {
  public [OptionalProps]?: 'synonyms' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'text' })
  public mindName!: string;

  @Property({ type: 'text' })
  public mindType!: string;

  @Property({ type: 'jsonb' })
  public synonyms: string[] = [];

  @Property({ type: 'text' })
  public mindVersion!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date = new Date();
}
