import { Entity } from '../Entity.js';
import { ResumeSkillItemId } from '../value-objects/ResumeSkillItemId.js';

export type ResumeSkillItemCreateProps = {
  categoryId: string;
  skillName: string;
  ordinal: number;
};

export class ResumeSkillItem extends Entity<ResumeSkillItemId> {
  public readonly categoryId: string;
  public skillName: string;
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ResumeSkillItemId;
    categoryId: string;
    skillName: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.categoryId = props.categoryId;
    this.skillName = props.skillName;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ResumeSkillItemCreateProps): ResumeSkillItem {
    const now = new Date();
    return new ResumeSkillItem({
      id: ResumeSkillItemId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
