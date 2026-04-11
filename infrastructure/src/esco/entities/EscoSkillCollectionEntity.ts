import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity({ tableName: 'esco_skill_collections' })
export class EscoSkillCollectionEntity {
  @PrimaryKey({ type: 'text' })
  public conceptUri!: string;

  @PrimaryKey({ type: 'text' })
  public collectionType!: string;

  @Property({ type: 'text' })
  public conceptType!: string;

  @Property({ type: 'text' })
  public preferredLabel!: string;

  @Property({ type: 'text' })
  public status!: string;

  @Property({ type: 'text', nullable: true })
  public skillType: string | null = null;

  @Property({ type: 'text', nullable: true })
  public reuseLevel: string | null = null;

  @Property({ type: 'text', nullable: true })
  public altLabels: string | null = null;

  @Property({ type: 'text', nullable: true })
  public description: string | null = null;

  @Property({ type: 'text', nullable: true })
  public broaderConceptUri: string | null = null;

  @Property({ type: 'text', nullable: true })
  public broaderConceptPt: string | null = null;
}
