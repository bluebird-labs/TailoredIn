import { Entity } from '../Entity.js';
import { ApprovalStatus } from '../value-objects/ApprovalStatus.js';
import { BulletId } from '../value-objects/BulletId.js';
import { TagSet } from '../value-objects/TagSet.js';
import type { BulletVariantSource } from './BulletVariant.js';
import { BulletVariant } from './BulletVariant.js';

export type BulletCreateProps = {
  experienceId: string;
  content: string;
  ordinal: number;
};

export class Bullet extends Entity<BulletId> {
  public readonly experienceId: string;
  public content: string;
  public ordinal: number;
  public tags: TagSet;
  public readonly variants: BulletVariant[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: BulletId;
    experienceId: string;
    content: string;
    ordinal: number;
    tags: TagSet;
    variants: BulletVariant[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.experienceId = props.experienceId;
    this.content = props.content;
    this.ordinal = props.ordinal;
    this.tags = props.tags;
    this.variants = props.variants;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addVariant(props: { text: string; angle: string; tags: TagSet; source: BulletVariantSource }): BulletVariant {
    const variant = BulletVariant.create({ bulletId: this.id.value, ...props });
    this.variants.push(variant);
    this.updatedAt = new Date();
    return variant;
  }

  public removeVariant(variantId: string): void {
    const index = this.variants.findIndex(v => v.id.value === variantId);
    if (index === -1) throw new Error(`Variant not found: ${variantId}`);
    this.variants.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findVariantOrFail(variantId: string): BulletVariant {
    const variant = this.variants.find(v => v.id.value === variantId);
    if (!variant) throw new Error(`Variant not found: ${variantId}`);
    return variant;
  }

  public get approvedVariants(): BulletVariant[] {
    return this.variants.filter(v => v.approvalStatus === ApprovalStatus.APPROVED);
  }

  public updateTags(tags: TagSet): void {
    this.tags = tags;
    this.updatedAt = new Date();
  }

  public static create(props: BulletCreateProps): Bullet {
    const now = new Date();
    return new Bullet({
      id: BulletId.generate(),
      ...props,
      tags: TagSet.empty(),
      variants: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
