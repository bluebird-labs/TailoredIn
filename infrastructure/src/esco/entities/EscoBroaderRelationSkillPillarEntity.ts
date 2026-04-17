import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'esco_broader_relations_skill_pillar' })
export class EscoBroaderRelationSkillPillarEntity {
  @PrimaryKey({ type: 'text' })
  public conceptUri!: string;

  @PrimaryKey({ type: 'text' })
  public broaderUri!: string;

  @Property({ type: 'text' })
  public conceptType!: string;

  @Property({ type: 'text' })
  public conceptLabel!: string;

  @Property({ type: 'text' })
  public broaderType!: string;

  @Property({ type: 'text' })
  public broaderLabel!: string;
}
