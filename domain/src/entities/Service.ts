import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type ServiceCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  deploymentTypes: string[];
  groups: string[];
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.SERVICE })
// @ts-expect-error TS2417 — STI subclass create() intentionally narrows parameter types
export class Service extends Skill {
  @Property({ fieldName: 'deployment_types', type: 'jsonb', nullable: true })
  public deploymentTypes: string[];

  @Property({ fieldName: 'groups', type: 'jsonb', nullable: true })
  public groups: string[];

  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(
    props: ConstructorParameters<typeof Skill>[0] & {
      deploymentTypes: string[];
      groups: string[];
      solvesApplicationTasks: string[];
      associatedApplicationDomains: string[];
    }
  ) {
    super(props);
    this.deploymentTypes = props.deploymentTypes;
    this.groups = props.groups;
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: ServiceCreateProps): Service {
    const now = new Date();
    return new Service({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.SERVICE,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      deploymentTypes: props.deploymentTypes,
      groups: props.groups,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
