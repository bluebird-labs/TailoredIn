import { Entity } from '../Entity.js';
import type { SkillAffinity } from '../value-objects/SkillAffinity.js';
import { SkillId } from '../value-objects/SkillId.js';

export type SkillCreateProps = {
  name: string;
  affinity: SkillAffinity;
  variants: string[];
};

export type SkillRefreshProps = Partial<SkillCreateProps>;

export class Skill extends Entity<SkillId> {
  public readonly name: string;
  public readonly key: string;
  public readonly affinity: SkillAffinity;
  public readonly variants: string[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: SkillId;
    name: string;
    key: string;
    affinity: SkillAffinity;
    variants: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.name = props.name;
    this.key = props.key;
    this.affinity = props.affinity;
    this.variants = props.variants;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public refresh(props: SkillRefreshProps): void {
    const mutable = this as { name?: string; affinity?: SkillAffinity; variants?: string[]; updatedAt: Date };
    if (props.name !== undefined) mutable.name = props.name;
    if (props.affinity !== undefined) mutable.affinity = props.affinity;
    if (props.variants !== undefined) mutable.variants = props.variants;
    mutable.updatedAt = new Date();
  }

  public static normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[\s\-./]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  public static create(props: SkillCreateProps): Skill {
    const now = new Date();
    const allVariants = props.variants.includes(props.name) ? props.variants : [props.name, ...props.variants];
    return new Skill({
      id: SkillId.generate(),
      name: props.name,
      key: Skill.normalizeName(props.name),
      affinity: props.affinity,
      variants: allVariants,
      createdAt: now,
      updatedAt: now
    });
  }
}
