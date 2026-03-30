import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeBullet } from '../resume/ResumeBullet.js';
import { ArchetypePosition } from './ArchetypePosition.js';

export type ArchetypePositionBulletProps = {
  id: string;
  position: RefOrEntity<ArchetypePosition>;
  bullet: RefOrEntity<ResumeBullet>;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ArchetypePositionBulletCreateProps = Omit<ArchetypePositionBulletProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'archetype_position_bullets' })
@Unique({ properties: ['position', 'bullet'], name: 'archetype_position_bullets_position_id_bullet_id_key' })
export class ArchetypePositionBullet extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => ArchetypePosition, { lazy: true, name: 'position_id' })
  public readonly position: RefOrEntity<ArchetypePosition>;

  @ManyToOne(() => ResumeBullet, { lazy: true, name: 'bullet_id' })
  public readonly bullet: RefOrEntity<ResumeBullet>;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: ArchetypePositionBulletProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.position = props.position;
    this.bullet = props.bullet;
    this.ordinal = props.ordinal;
  }

  public static create(props: ArchetypePositionBulletCreateProps): ArchetypePositionBullet {
    const now = new Date();
    return new ArchetypePositionBullet({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
