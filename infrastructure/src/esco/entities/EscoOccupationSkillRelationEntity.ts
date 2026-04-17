import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'esco_occupation_skill_relations' })
export class EscoOccupationSkillRelationEntity {
  @PrimaryKey({ type: 'text' })
  public occupationUri!: string;

  @PrimaryKey({ type: 'text' })
  public skillUri!: string;

  @Property({ type: 'text' })
  public occupationLabel!: string;

  @Property({ type: 'text' })
  public relationType!: string;

  @Property({ type: 'text', nullable: true })
  public skillType: string | null = null;

  @Property({ type: 'text' })
  public skillLabel!: string;
}
