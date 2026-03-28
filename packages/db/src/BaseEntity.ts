import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity as MikroOrmBaseEntity } from '@mikro-orm/postgresql';
import type { BaseEntityProps } from './BaseEntity.types.js';

@Entity({ abstract: true })
export class BaseEntity extends MikroOrmBaseEntity {
  @Property({ name: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Property({ name: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  constructor(props: BaseEntityProps) {
    super();
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
