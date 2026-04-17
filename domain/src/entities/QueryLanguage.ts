import { Entity } from '@mikro-orm/decorators/legacy';
import { normalizeLabel } from '@tailoredin/core';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill, type SkillCreateProps } from './Skill.js';

@Entity({ discriminatorValue: SkillKind.QUERY_LANGUAGE })
export class QueryLanguage extends Skill {
  public static override create(props: Omit<SkillCreateProps, 'kind'>): QueryLanguage {
    const now = new Date();
    return new QueryLanguage({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.QUERY_LANGUAGE,
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
