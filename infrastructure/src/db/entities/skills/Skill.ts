import { ArrayType, EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Enum, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';
import { SkillAffinity } from './SkillAffinity.js';
import { SkillOrmRepository } from './SkillOrmRepository.js';

export type SkillProps = {
  id: string;
  name: string;
  key: string;
  affinity: SkillAffinity;
  variants: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type SkillCreateProps = Omit<SkillProps, 'id' | 'createdAt' | 'updatedAt' | 'key'>;
type SkillRefreshProps = Partial<SkillCreateProps>;

@Entity({ tableName: 'skills', repository: () => SkillOrmRepository })
export class Skill extends BaseEntity {
  public [EntityRepositoryType]?: SkillOrmRepository;

  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'name', type: 'text' })
  public name: string;

  @Property({ name: 'key', type: 'text', unique: 'skills_key_unique' })
  public key: string;

  @Enum({
    name: 'affinity',
    items: () => SkillAffinity,
    nativeEnumName: 'skill_affinity',
    default: SkillAffinity.EXPERT
  })
  public affinity: SkillAffinity;

  @Property({ type: new ArrayType(v => v) })
  public variants: string[];

  public constructor(props: SkillProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.name = props.name;
    this.key = props.key;
    this.affinity = props.affinity;
    this.variants = props.variants;
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
      id: generateUuid(),
      name: props.name,
      key: Skill.normalizeName(props.name),
      affinity: props.affinity,
      variants: allVariants,
      createdAt: now,
      updatedAt: now
    });
  }

  public refresh(props: SkillRefreshProps): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.affinity !== undefined) this.affinity = props.affinity;
    if (props.variants !== undefined) this.variants = props.variants;
    this.updatedAt = new Date();
  }
}
