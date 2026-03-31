import { Entity } from '../Entity.js';
import { ResumeBulletId } from '../value-objects/ResumeBulletId.js';

export type ResumeBulletCreateProps = {
  resumePositionId: string;
  content: string;
  ordinal: number;
};

export class ResumeBullet extends Entity<ResumeBulletId> {
  public readonly resumePositionId: string;
  public content: string;
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ResumeBulletId;
    resumePositionId: string;
    content: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.resumePositionId = props.resumePositionId;
    this.content = props.content;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ResumeBulletCreateProps): ResumeBullet {
    const now = new Date();
    return new ResumeBullet({
      id: ResumeBulletId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
