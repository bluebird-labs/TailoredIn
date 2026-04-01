import { Entity } from '../Entity.js';
import { ApprovalStatus } from '../value-objects/ApprovalStatus.js';
import { BulletVariantId } from '../value-objects/BulletVariantId.js';
import type { TagSet } from '../value-objects/TagSet.js';

export type BulletVariantSource = 'llm' | 'manual';

export type BulletVariantCreateProps = {
  bulletId: string;
  text: string;
  angle: string;
  tags: TagSet;
  source: BulletVariantSource;
};

export class BulletVariant extends Entity<BulletVariantId> {
  public readonly bulletId: string;
  public text: string;
  public angle: string;
  public tags: TagSet;
  public readonly source: BulletVariantSource;
  public approvalStatus: ApprovalStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: BulletVariantId;
    bulletId: string;
    text: string;
    angle: string;
    tags: TagSet;
    source: BulletVariantSource;
    approvalStatus: ApprovalStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.bulletId = props.bulletId;
    this.text = props.text;
    this.angle = props.angle;
    this.tags = props.tags;
    this.source = props.source;
    this.approvalStatus = props.approvalStatus;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public approve(): void {
    this.approvalStatus = ApprovalStatus.APPROVED;
    this.updatedAt = new Date();
  }

  public reject(): void {
    this.approvalStatus = ApprovalStatus.REJECTED;
    this.updatedAt = new Date();
  }

  public static create(props: BulletVariantCreateProps): BulletVariant {
    const now = new Date();
    return new BulletVariant({
      id: BulletVariantId.generate(),
      ...props,
      approvalStatus: props.source === 'manual' ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      createdAt: now,
      updatedAt: now
    });
  }
}
