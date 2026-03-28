import { BaseEntity } from '../../BaseEntity';
import { ArrayType, Entity, Enum, Property } from '@mikro-orm/core';
import { TransientSkillCreateProps, TransientSkillProps } from './TransientSkill.types';
import { SkillAffinity } from './SkillAffinity';
import { StringUtil } from '../../../utils/StringUtil';

@Entity({ abstract: true })
export class TransientSkill extends BaseEntity {
  @Property({ name: 'name', type: 'text' })
  public readonly name: string;

  @Property({ name: 'key', type: 'text', unique: 'skills_key_unique' })
  public readonly key: string;

  @Enum({
    name: 'affinity',
    items: () => SkillAffinity,
    nativeEnumName: 'skill_affinity',
    default: SkillAffinity.EXPERT
  })
  public readonly affinity: SkillAffinity;

  @Property({ type: new ArrayType(v => v) })
  public readonly variants: string[];

  protected constructor(props: TransientSkillProps) {
    super(props);
    this.name = props.name;
    this.key = props.key;
    this.affinity = props.affinity;
    this.variants = props.variants;
  }

  public static create(props: TransientSkillCreateProps): TransientSkill {
    return new TransientSkill({
      ...props,
      key: TransientSkill.normalizeName(props.name),
      variants: props.variants.includes(props.name) ? props.variants : [props.name, ...props.variants],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  protected static normalizeName(name: string): string {
    return StringUtil.toLowerSnakeCase(name);
  }
}
