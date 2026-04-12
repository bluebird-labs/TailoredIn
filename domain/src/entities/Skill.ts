import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import type { SkillType } from '../value-objects/SkillType.js';

export type SkillCreateProps = {
  label: string;
  type: SkillType;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
};

@Entity({ tableName: 'skills' })
export class Skill extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'label', type: 'text' })
  public label: string;

  @Property({ fieldName: 'normalized_label', type: 'text', unique: true })
  public normalizedLabel: string;

  @Property({ fieldName: 'type', type: 'text' })
  public type: SkillType;

  @Property({ fieldName: 'category_id', type: 'uuid', nullable: true })
  public categoryId: string | null;

  @Property({ fieldName: 'description', type: 'text', nullable: true })
  public description: string | null;

  @Property({ fieldName: 'aliases', type: 'jsonb' })
  public aliases: SkillAlias[];

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    label: string;
    normalizedLabel: string;
    type: SkillType;
    categoryId: string | null;
    description: string | null;
    aliases: SkillAlias[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.label || props.label.length > 500)
      throw new ValidationError('label', 'must be between 1 and 500 characters');
    this.id = props.id;
    this.label = props.label;
    this.normalizedLabel = props.normalizedLabel;
    this.type = props.type;
    this.categoryId = props.categoryId;
    this.description = props.description;
    this.aliases = props.aliases;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: SkillCreateProps): Skill {
    const now = new Date();
    return new Skill({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      type: props.type,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      createdAt: now,
      updatedAt: now
    });
  }
}
