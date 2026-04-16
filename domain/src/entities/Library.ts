import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type LibraryCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  supportedLanguages: string[];
  specificToFrameworks: string[];
  adapterForToolOrService: string[];
  implementsPatterns: string[];
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.LIBRARY })
// @ts-expect-error TS2417 — STI subclass create() intentionally narrows parameter types
export class Library extends Skill {
  @Property({ fieldName: 'supported_languages', type: 'jsonb', nullable: true })
  public supportedLanguages: string[];

  @Property({ fieldName: 'specific_to_frameworks', type: 'jsonb', nullable: true })
  public specificToFrameworks: string[];

  @Property({ fieldName: 'adapter_for_tool_or_service', type: 'jsonb', nullable: true })
  public adapterForToolOrService: string[];

  @Property({ fieldName: 'implements_patterns', type: 'jsonb', nullable: true })
  public implementsPatterns: string[];

  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(
    props: ConstructorParameters<typeof Skill>[0] & {
      supportedLanguages: string[];
      specificToFrameworks: string[];
      adapterForToolOrService: string[];
      implementsPatterns: string[];
      solvesApplicationTasks: string[];
      associatedApplicationDomains: string[];
    }
  ) {
    super(props);
    this.supportedLanguages = props.supportedLanguages;
    this.specificToFrameworks = props.specificToFrameworks;
    this.adapterForToolOrService = props.adapterForToolOrService;
    this.implementsPatterns = props.implementsPatterns;
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: LibraryCreateProps): Library {
    const now = new Date();
    return new Library({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.LIBRARY,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      supportedLanguages: props.supportedLanguages,
      specificToFrameworks: props.specificToFrameworks,
      adapterForToolOrService: props.adapterForToolOrService,
      implementsPatterns: props.implementsPatterns,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
