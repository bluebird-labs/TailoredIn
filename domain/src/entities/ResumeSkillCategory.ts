import { AggregateRoot } from '../AggregateRoot.js';
import { ResumeSkillCategoryId } from '../value-objects/ResumeSkillCategoryId.js';
import { ResumeSkillItem } from './ResumeSkillItem.js';

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

  public constructor(props: {
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

  public addItem(props: { skillName: string; ordinal: number }): ResumeSkillItem {
    const item = ResumeSkillItem.create({ categoryId: this.id.value, ...props });
    this.items.push(item);
    this.updatedAt = new Date();
    return item;
  }

  public updateItem(itemId: string, update: { skillName?: string; ordinal?: number }): void {
    const item = this.items.find(i => i.id.value === itemId);
    if (!item) throw new Error(`Skill item not found: ${itemId}`);
    if (update.skillName !== undefined) item.skillName = update.skillName;
    if (update.ordinal !== undefined) item.ordinal = update.ordinal;
    item.updatedAt = new Date();
    this.updatedAt = new Date();
  }

  public removeItem(itemId: string): void {
    const index = this.items.findIndex(i => i.id.value === itemId);
    if (index === -1) throw new Error(`Skill item not found: ${itemId}`);
    this.items.splice(index, 1);
    this.updatedAt = new Date();
  }

  public static create(props: ResumeSkillCategoryCreateProps): ResumeSkillCategory {
    const now = new Date();
    return new ResumeSkillCategory({
      id: ResumeSkillCategoryId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
