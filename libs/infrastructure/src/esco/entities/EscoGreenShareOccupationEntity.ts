import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'esco_green_share_occupations' })
export class EscoGreenShareOccupationEntity {
  @PrimaryKey({ type: 'text' })
  public conceptUri!: string;

  @Property({ type: 'text' })
  public conceptType!: string;

  @Property({ type: 'text' })
  public code!: string;

  @Property({ type: 'text' })
  public preferredLabel!: string;

  @Property({ columnType: 'real' })
  public greenShare!: number;
}
