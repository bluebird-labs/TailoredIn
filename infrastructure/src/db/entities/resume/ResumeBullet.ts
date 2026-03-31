import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumePosition } from './ResumePosition.js';

export type ResumeBulletProps = {
  id: string;
  resumePosition: RefOrEntity<ResumePosition>;
  content: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeBulletCreateProps = Omit<ResumeBulletProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_bullets' })
export class ResumeBullet extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => ResumePosition, { lazy: true, name: 'resume_position_id' })
  public readonly resumePosition: RefOrEntity<ResumePosition>;

  @Property({ name: 'content', type: 'text' })
  public content: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: ResumeBulletProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.resumePosition = props.resumePosition;
    this.content = props.content;
    this.ordinal = props.ordinal;
  }

  public static create(props: ResumeBulletCreateProps): ResumeBullet {
    const now = new Date();
    return new ResumeBullet({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
