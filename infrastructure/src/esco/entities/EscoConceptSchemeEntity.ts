import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity({ tableName: 'esco_concept_schemes' })
export class EscoConceptSchemeEntity {
  public [OptionalProps]?: 'escoVersion' | 'createdAt' | 'updatedAt';

  @PrimaryKey({ type: 'text' })
  public conceptSchemeUri!: string;

  @Property({ type: 'text' })
  public conceptType!: string;

  @Property({ type: 'text' })
  public preferredLabel!: string;

  @Property({ type: 'text', nullable: true })
  public title: string | null = null;

  @Property({ type: 'text', nullable: true })
  public status: string | null = null;

  @Property({ type: 'text', nullable: true })
  public description: string | null = null;

  @Property({ type: 'text', nullable: true })
  public hasTopConcept: string | null = null;

  @Property({ type: 'text', default: "'1.2.1'" })
  public escoVersion: string = '1.2.1';

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date = new Date();

  @Property({ type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date = new Date();
}
