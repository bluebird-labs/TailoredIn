import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'esco_skill_groups' })
export class EscoSkillGroupEntity {
  public [OptionalProps]?: 'escoVersion' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'text' })
  public conceptUri!: string;

  @Property({ type: 'text' })
  public conceptType!: string;

  @Property({ type: 'text' })
  public preferredLabel!: string;

  @Property({ type: 'text', nullable: true })
  public altLabels: string | null = null;

  @Property({ type: 'text', nullable: true })
  public hiddenLabels: string | null = null;

  @Property({ type: 'text' })
  public status!: string;

  @Property({ type: 'text', nullable: true })
  public modifiedDate: string | null = null;

  @Property({ type: 'text', nullable: true })
  public scopeNote: string | null = null;

  @Property({ type: 'text', nullable: true })
  public inScheme: string | null = null;

  @Property({ type: 'text', nullable: true })
  public description: string | null = null;

  @Property({ type: 'text' })
  public code!: string;

  @Property({ type: 'text', default: "'1.2.1'" })
  public escoVersion: string = '1.2.1';

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date = new Date();
}
