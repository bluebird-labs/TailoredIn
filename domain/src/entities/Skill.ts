import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { normalizeLabel } from '@tailoredin/core';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import type { SkillKind } from '../value-objects/SkillKind.js';

export type SkillCreateProps = {
  label: string;
  kind: SkillKind;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
};

@Entity({ tableName: 'skills', discriminatorColumn: 'kind' })
export class Skill extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'label', type: 'text' })
  public label: string;

  @Property({ fieldName: 'normalized_label', type: 'text', unique: true })
  public normalizedLabel: string;

  @Property({ fieldName: 'kind', type: 'text' })
  public kind: SkillKind;

  @Property({ fieldName: 'category_id', type: 'uuid', nullable: true })
  public categoryId: string | null;

  @Property({ fieldName: 'description', type: 'text', nullable: true })
  public description: string | null;

  @Property({ fieldName: 'aliases', type: 'jsonb' })
  public aliases: SkillAlias[];

  @Property({ fieldName: 'technical_domains', type: 'jsonb' })
  public technicalDomains: string[];

  @Property({ fieldName: 'conceptual_aspects', type: 'jsonb' })
  public conceptualAspects: string[];

  @Property({ fieldName: 'architectural_patterns', type: 'jsonb' })
  public architecturalPatterns: string[];

  @Property({ fieldName: 'mind_name', type: 'text', nullable: true })
  public mindName: string | null;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    label: string;
    normalizedLabel: string;
    kind: SkillKind;
    categoryId: string | null;
    description: string | null;
    aliases: SkillAlias[];
    technicalDomains: string[];
    conceptualAspects: string[];
    architecturalPatterns: string[];
    mindName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.label || props.label.length > 500)
      throw new ValidationError('label', 'must be between 1 and 500 characters');
    this.id = props.id;
    this.label = props.label;
    this.normalizedLabel = props.normalizedLabel;
    this.kind = props.kind;
    this.categoryId = props.categoryId;
    this.description = props.description;
    this.aliases = props.aliases;
    this.technicalDomains = props.technicalDomains;
    this.conceptualAspects = props.conceptualAspects;
    this.architecturalPatterns = props.architecturalPatterns;
    this.mindName = props.mindName;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: SkillCreateProps): Skill {
    const now = new Date();
    return new Skill({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: props.kind,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now
    });
  }
}
