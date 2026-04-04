import { Entity } from '../Entity.js';
import { BulletId } from '../value-objects/BulletId.js';
import type { BulletStatus } from '../value-objects/BulletStatus.js';
import { TagSet } from '../value-objects/TagSet.js';

type BulletCreateProps = {
  experienceId: string;
  content: string;
  ordinal: number;
  verboseDescription?: string | null;
  status?: BulletStatus;
};

export class Bullet extends Entity<BulletId> {
  public readonly experienceId: string;
  public content: string;
  public verboseDescription: string | null;
  public status: BulletStatus;
  public ordinal: number;
  public tags: TagSet;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: BulletId;
    experienceId: string;
    content: string;
    verboseDescription: string | null;
    status: BulletStatus;
    ordinal: number;
    tags: TagSet;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.experienceId = props.experienceId;
    this.content = props.content;
    this.verboseDescription = props.verboseDescription;
    this.status = props.status;
    this.ordinal = props.ordinal;
    this.tags = props.tags;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateTags(tags: TagSet): void {
    this.tags = tags;
    this.updatedAt = new Date();
  }

  public updateVerboseDescription(verboseDescription: string): void {
    this.verboseDescription = verboseDescription;
    this.updatedAt = new Date();
  }

  public static create(props: BulletCreateProps): Bullet {
    const now = new Date();
    return new Bullet({
      id: BulletId.generate(),
      ...props,
      verboseDescription: props.verboseDescription ?? null,
      status: props.status ?? 'active',
      tags: TagSet.empty(),
      createdAt: now,
      updatedAt: now
    });
  }
}
