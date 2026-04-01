import { Entity } from '../Entity.js';
import { SkillItemId } from '../value-objects/SkillItemId.js';

export type SkillItemCreateProps = {
  categoryId: string;
  name: string;
  ordinal: number;
};

export class SkillItem extends Entity<SkillItemId> {
  public readonly categoryId: string;
  public name: string;
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: SkillItemId;
    categoryId: string;
    name: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.categoryId = props.categoryId;
    this.name = props.name;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: SkillItemCreateProps): SkillItem {
    const now = new Date();
    return new SkillItem({
      id: SkillItemId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
