import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity as MikroOrmBaseEntity } from '@mikro-orm/postgresql';

export type BaseEntityProps = {
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ abstract: true })
export class BaseEntity extends MikroOrmBaseEntity {
  @Property({ name: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Property({ name: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: BaseEntityProps) {
    super();
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
