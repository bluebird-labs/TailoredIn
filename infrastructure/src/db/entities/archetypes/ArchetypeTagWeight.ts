import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity as MikroOrmBaseEntity } from '@mikro-orm/postgresql';
import { UuidPrimaryKey } from '../../helpers.js';

export type ArchetypeTagWeightProps = {
  id: string;
  archetypeId: string;
  tagId: string;
  weight: number;
};

@Entity({ tableName: 'archetype_tag_weights' })
export class ArchetypeTagWeight extends MikroOrmBaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'archetype_id', type: 'uuid' })
  public readonly archetypeId: string;

  @Property({ name: 'tag_id', type: 'uuid' })
  public readonly tagId: string;

  @Property({ name: 'weight', type: 'real' })
  public weight: number;

  public constructor(props: ArchetypeTagWeightProps) {
    super();
    this.id = props.id;
    this.archetypeId = props.archetypeId;
    this.tagId = props.tagId;
    this.weight = props.weight;
  }
}
