import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity({ tableName: 'esco_skill_skill_relations' })
export class EscoSkillSkillRelationEntity {
  @PrimaryKey({ type: 'text' })
  public originalSkillUri!: string;

  @PrimaryKey({ type: 'text' })
  public relatedSkillUri!: string;

  @Property({ type: 'text' })
  public originalSkillType!: string;

  @Property({ type: 'text' })
  public relationType!: string;

  @Property({ type: 'text' })
  public relatedSkillType!: string;
}
