import { AggregateRoot } from '../AggregateRoot.js';
import { SkillCategoryId } from '../value-objects/SkillCategoryId.js';
import { SkillItem } from './SkillItem.js';

export type SkillCategoryCreateProps = {
  profileId: string;
  name: string;
  ordinal: number;
};

export class SkillCategory extends AggregateRoot<SkillCategoryId> {
  public readonly profileId: string;
  public name: string;
  public ordinal: number;
  public readonly items: SkillItem[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: SkillCategoryId;
    profileId: string;
    name: string;
    ordinal: number;
    items: SkillItem[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.name = props.name;
    this.ordinal = props.ordinal;
    this.items = props.items;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addItem(props: { name: string; ordinal: number }): SkillItem {
    const item = SkillItem.create({ categoryId: this.id.value, ...props });
    this.items.push(item);
    this.updatedAt = new Date();
    return item;
  }

  public updateItem(itemId: string, update: { name?: string; ordinal?: number }): void {
    const item = this.items.find(i => i.id.value === itemId);
    if (!item) throw new Error(`Skill item not found: ${itemId}`);
    if (update.name !== undefined) item.name = update.name;
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

  public static create(props: SkillCategoryCreateProps): SkillCategory {
    const now = new Date();
    return new SkillCategory({
      id: SkillCategoryId.generate(),
      ...props,
      items: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
