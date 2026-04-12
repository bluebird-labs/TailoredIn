import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';

export type SkillCategoryCreateProps = {
  label: string;
};

@Entity({ tableName: 'skill_categories' })
export class SkillCategory extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'label', type: 'text' })
  public label: string;

  @Property({ fieldName: 'normalized_label', type: 'text', unique: true })
  public normalizedLabel: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    label: string;
    normalizedLabel: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.label || props.label.length > 500)
      throw new ValidationError('label', 'must be between 1 and 500 characters');
    this.id = props.id;
    this.label = props.label;
    this.normalizedLabel = props.normalizedLabel;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: SkillCategoryCreateProps): SkillCategory {
    const now = new Date();
    return new SkillCategory({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      createdAt: now,
      updatedAt: now
    });
  }
}
