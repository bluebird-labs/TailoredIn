import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { ResumeSkillCategory } from './ResumeSkillCategory.js';

export type ResumeSkillItemProps = {
  id: string;
  category: RefOrEntity<ResumeSkillCategory>;
  skillName: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeSkillItemCreateProps = Omit<ResumeSkillItemProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_skill_items' })
export class ResumeSkillItem extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => ResumeSkillCategory, { lazy: true, name: 'category_id' })
  public readonly category: RefOrEntity<ResumeSkillCategory>;

  @Property({ name: 'skill_name', type: 'text' })
  public skillName: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  constructor(props: ResumeSkillItemProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.category = props.category;
    this.skillName = props.skillName;
    this.ordinal = props.ordinal;
  }

  static create(props: ResumeSkillItemCreateProps): ResumeSkillItem {
    const now = new Date();
    return new ResumeSkillItem({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
