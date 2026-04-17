import { Entity } from '@mikro-orm/decorators/legacy';
import { normalizeLabel } from '@tailoredin/core';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill, type SkillCreateProps } from './Skill.js';

@Entity({ discriminatorValue: SkillKind.MARKUP_LANGUAGE })
export class MarkupLanguage extends Skill {
  public static override create(props: Omit<SkillCreateProps, 'kind'>): MarkupLanguage {
    const now = new Date();
    return new MarkupLanguage({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.MARKUP_LANGUAGE,
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
