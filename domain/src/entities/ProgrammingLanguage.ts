import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type ProgrammingLanguageCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  runtimeEnvironments: string[];
  buildTools: string[];
  paradigms: string[];
};

@Entity({ discriminatorValue: SkillKind.PROGRAMMING_LANGUAGE })
// @ts-expect-error TS2417 — STI subclass create() intentionally narrows parameter types
export class ProgrammingLanguage extends Skill {
  @Property({ fieldName: 'runtime_environments', type: 'jsonb', nullable: true })
  public runtimeEnvironments: string[];

  @Property({ fieldName: 'build_tools', type: 'jsonb', nullable: true })
  public buildTools: string[];

  @Property({ fieldName: 'paradigms', type: 'jsonb', nullable: true })
  public paradigms: string[];

  public constructor(
    props: ConstructorParameters<typeof Skill>[0] & {
      runtimeEnvironments: string[];
      buildTools: string[];
      paradigms: string[];
    }
  ) {
    super(props);
    this.runtimeEnvironments = props.runtimeEnvironments;
    this.buildTools = props.buildTools;
    this.paradigms = props.paradigms;
  }

  public static override create(props: ProgrammingLanguageCreateProps): ProgrammingLanguage {
    const now = new Date();
    return new ProgrammingLanguage({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.PROGRAMMING_LANGUAGE,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      runtimeEnvironments: props.runtimeEnvironments,
      buildTools: props.buildTools,
      paradigms: props.paradigms
    });
  }
}
