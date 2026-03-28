import { BaseEntity as MikroOrmBaseEntity, Entity, Property } from '@mikro-orm/postgresql';
import { BaseEntityProps } from './BaseEntity.types.js';

@Entity({ abstract: true })
export abstract class BaseEntity extends MikroOrmBaseEntity {
  @Property({ name: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Property({ name: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  protected constructor(props: BaseEntityProps) {
    super();
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
