import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type ProtocolCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.PROTOCOL })
// @ts-expect-error TS2417 — STI subclass create() intentionally narrows parameter types
export class Protocol extends Skill {
  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(
    props: ConstructorParameters<typeof Skill>[0] & {
      solvesApplicationTasks: string[];
      associatedApplicationDomains: string[];
    }
  ) {
    super(props);
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: ProtocolCreateProps): Protocol {
    const now = new Date();
    return new Protocol({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.PROTOCOL,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
