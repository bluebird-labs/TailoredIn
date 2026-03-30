import { AggregateRoot } from '../AggregateRoot.js';
import { ResumeSkillCategoryId } from '../value-objects/ResumeSkillCategoryId.js';
import type { ResumeSkillItem } from './ResumeSkillItem.js';

export type ResumeSkillCategoryCreateProps = {
  userId: string;
  categoryName: string;
  ordinal: number;
  items: ResumeSkillItem[];
};

export class ResumeSkillCategory extends AggregateRoot<ResumeSkillCategoryId> {
  public readonly userId: string;
  public categoryName: string;
  public ordinal: number;
  public readonly items: ResumeSkillItem[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: {
    id: ResumeSkillCategoryId;
    userId: string;
    categoryName: string;
    ordinal: number;
    items: ResumeSkillItem[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.userId = props.userId;
    this.categoryName = props.categoryName;
    this.ordinal = props.ordinal;
    this.items = props.items;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: ResumeSkillCategoryCreateProps): ResumeSkillCategory {
    const now = new Date();
    return new ResumeSkillCategory({
      id: ResumeSkillCategoryId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
