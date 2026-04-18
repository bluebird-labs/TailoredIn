import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'mind_relations' })
export class MindRelationEntity {
  public [OptionalProps]?: 'createdAt';

  @PrimaryKey({ type: 'text' })
  public mindSourceName!: string;

  @PrimaryKey({ type: 'text' })
  public mindTargetName!: string;

  @PrimaryKey({ type: 'text' })
  public relationType!: string;

  @Property({ type: 'text' })
  public mindVersion!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date = new Date();
}
