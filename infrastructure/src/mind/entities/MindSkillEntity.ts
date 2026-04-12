import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity({ tableName: 'mind_skills' })
export class MindSkillEntity {
  public [OptionalProps]?:
    | 'synonyms'
    | 'technicalDomains'
    | 'impliesKnowingSkills'
    | 'impliesKnowingConcepts'
    | 'conceptualAspects'
    | 'architecturalPatterns'
    | 'supportedProgrammingLanguages'
    | 'specificToFrameworks'
    | 'adapterForToolOrService'
    | 'implementsPatterns'
    | 'associatedToApplicationDomains'
    | 'solvesApplicationTasks'
    | 'buildTools'
    | 'runtimeEnvironments'
    | 'createdAt'
    | 'updatedAt';

  @PrimaryKey({ type: 'text' })
  public mindName!: string;

  @Property({ type: 'jsonb' })
  public mindType!: string[];

  @Property({ type: 'jsonb' })
  public synonyms: string[] = [];

  @Property({ type: 'jsonb' })
  public technicalDomains: string[] = [];

  @Property({ type: 'jsonb' })
  public impliesKnowingSkills: string[] = [];

  @Property({ type: 'jsonb' })
  public impliesKnowingConcepts: string[] = [];

  @Property({ type: 'jsonb' })
  public conceptualAspects: string[] = [];

  @Property({ type: 'jsonb' })
  public architecturalPatterns: string[] = [];

  @Property({ type: 'jsonb' })
  public supportedProgrammingLanguages: string[] = [];

  @Property({ type: 'jsonb' })
  public specificToFrameworks: string[] = [];

  @Property({ type: 'jsonb' })
  public adapterForToolOrService: string[] = [];

  @Property({ type: 'jsonb' })
  public implementsPatterns: string[] = [];

  @Property({ type: 'jsonb' })
  public associatedToApplicationDomains: string[] = [];

  @Property({ type: 'jsonb' })
  public solvesApplicationTasks: string[] = [];

  @Property({ type: 'jsonb' })
  public buildTools: string[] = [];

  @Property({ type: 'jsonb' })
  public runtimeEnvironments: string[] = [];

  @Property({ type: 'text' })
  public mindSourceFile!: string;

  @Property({ type: 'text' })
  public mindVersion!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date = new Date();
}
