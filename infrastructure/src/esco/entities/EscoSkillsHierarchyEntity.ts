import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity({ tableName: 'esco_skills_hierarchy' })
export class EscoSkillsHierarchyEntity {
  public [OptionalProps]?: 'id';

  @PrimaryKey({ autoincrement: true })
  public id!: number;

  @Property({ type: 'text' })
  public level0Uri!: string;

  @Property({ type: 'text' })
  public level0PreferredTerm!: string;

  @Property({ type: 'text', nullable: true })
  public level1Uri: string | null = null;

  @Property({ type: 'text', nullable: true })
  public level1PreferredTerm: string | null = null;

  @Property({ type: 'text', nullable: true })
  public level2Uri: string | null = null;

  @Property({ type: 'text', nullable: true })
  public level2PreferredTerm: string | null = null;

  @Property({ type: 'text', nullable: true })
  public level3Uri: string | null = null;

  @Property({ type: 'text', nullable: true })
  public level3PreferredTerm: string | null = null;

  @Property({ type: 'text', nullable: true })
  public description: string | null = null;

  @Property({ type: 'text', nullable: true })
  public scopeNote: string | null = null;

  @Property({ type: 'text' })
  public level0Code!: string;

  @Property({ type: 'text', nullable: true })
  public level1Code: string | null = null;

  @Property({ type: 'text', nullable: true })
  public level2Code: string | null = null;

  @Property({ type: 'text', nullable: true })
  public level3Code: string | null = null;
}
