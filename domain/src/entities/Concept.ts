import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { normalizeLabel } from '@tailoredin/core';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';
import type { ConceptKind } from '../value-objects/ConceptKind.js';

export type ConceptCreateProps = {
  label: string;
  kind: ConceptKind;
  category: string | null;
  mindName: string | null;
};

@Entity({ tableName: 'concepts' })
export class Concept extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'label', type: 'text' })
  public label: string;

  @Property({ fieldName: 'normalized_label', type: 'text', unique: true })
  public normalizedLabel: string;

  @Property({ fieldName: 'kind', type: 'text' })
  public kind: ConceptKind;

  @Property({ fieldName: 'category', type: 'text', nullable: true })
  public category: string | null;

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
    kind: ConceptKind;
    category: string | null;
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
    this.category = props.category;
    this.mindName = props.mindName;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ConceptCreateProps): Concept {
    const now = new Date();
    return new Concept({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: props.kind,
      category: props.category,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now
    });
  }
}
