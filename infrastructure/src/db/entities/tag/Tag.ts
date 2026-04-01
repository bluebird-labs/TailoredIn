import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity as MikroOrmBaseEntity } from '@mikro-orm/postgresql';
import { UuidPrimaryKey } from '../../helpers.js';

export type TagProps = {
  id: string;
  name: string;
  dimension: string;
  createdAt: Date;
};

export type TagCreateProps = Omit<TagProps, 'id' | 'createdAt'>;

@Entity({ tableName: 'tags' })
export class Tag extends MikroOrmBaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'name', type: 'text' })
  public readonly name: string;

  @Property({ name: 'dimension', type: 'text' })
  public readonly dimension: string;

  @Property({ name: 'created_at', type: 'timestamptz', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  public constructor(props: TagProps) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.dimension = props.dimension;
    this.createdAt = props.createdAt;
  }
}
