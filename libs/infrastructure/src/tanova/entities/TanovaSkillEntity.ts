import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'tanova_skills' })
export class TanovaSkillEntity {
  public [OptionalProps]?:
    | 'category'
    | 'subcategory'
    | 'tags'
    | 'description'
    | 'aliases'
    | 'parentSkills'
    | 'childSkills'
    | 'relatedSkills'
    | 'transferability'
    | 'proficiencyLevels'
    | 'typicalRoles'
    | 'industryDemand'
    | 'prerequisites'
    | 'createdAt'
    | 'updatedAt';

  @PrimaryKey({ type: 'text' })
  public tanovaId!: string;

  @Property({ type: 'text' })
  public canonicalName!: string;

  @Property({ type: 'text', nullable: true })
  public category: string | null = null;

  @Property({ type: 'text', nullable: true })
  public subcategory: string | null = null;

  @Property({ type: 'jsonb', default: '[]' })
  public tags: string[] = [];

  @Property({ type: 'text', nullable: true })
  public description: string | null = null;

  @Property({ type: 'jsonb', default: '[]' })
  public aliases: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  public parentSkills: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  public childSkills: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  public relatedSkills: string[] = [];

  @Property({ type: 'jsonb', nullable: true })
  public transferability: Record<string, number> | null = null;

  @Property({ type: 'jsonb', nullable: true })
  public proficiencyLevels: Record<string, unknown> | null = null;

  @Property({ type: 'jsonb', default: '[]' })
  public typicalRoles: string[] = [];

  @Property({ type: 'text', nullable: true })
  public industryDemand: string | null = null;

  @Property({ type: 'jsonb', default: '[]' })
  public prerequisites: string[] = [];

  @Property({ type: 'text' })
  public tanovaVersion!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date = new Date();
}
