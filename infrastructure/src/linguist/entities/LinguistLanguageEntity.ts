import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'linguist_languages' })
export class LinguistLanguageEntity {
  public [OptionalProps]?: 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'text' })
  public linguistName!: string;

  @Property({ type: 'text' })
  public linguistType!: string;

  @Property({ type: 'text', nullable: true })
  public color: string | null = null;

  @Property({ type: 'jsonb', default: '[]' })
  public aliases: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  public extensions: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  public interpreters: string[] = [];

  @Property({ type: 'text', nullable: true })
  public tmScope: string | null = null;

  @Property({ type: 'text', nullable: true })
  public aceMode: string | null = null;

  @Property({ type: 'text', nullable: true })
  public codemirrorMode: string | null = null;

  @Property({ type: 'text', nullable: true })
  public codemirrorMimeType: string | null = null;

  @Property({ type: 'integer', nullable: true })
  public linguistLanguageId: number | null = null;

  @Property({ type: 'text', nullable: true })
  public linguistGroup: string | null = null;

  @Property({ type: 'text' })
  public linguistVersion!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date = new Date();
}
