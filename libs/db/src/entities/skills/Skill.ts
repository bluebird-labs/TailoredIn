import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity } from '@mikro-orm/decorators/es';
import { ObjectUtil } from '@tailoredin/shared';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';
import type { SkillCreateProps, SkillProps, SkillRefreshProps } from './Skill.types.js';
import { SkillRepository } from './SkillRepository.js';
import { TransientSkill } from './TransientSkill.js';
import type { TransientSkillCreateProps } from './TransientSkill.types.js';

@Entity({ tableName: 'skills', repository: () => SkillRepository })
export class Skill extends TransientSkill {
  public [EntityRepositoryType]?: SkillRepository;

  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  constructor(props: SkillProps) {
    super(props);
    this.id = props.id;
  }

  public static createTransient(props: TransientSkillCreateProps): TransientSkill {
    return TransientSkill.create(props);
  }

  public static fromTransient(transientSkill: TransientSkill) {
    return new Skill({
      id: generateUuid(),
      name: transientSkill.name,
      key: transientSkill.key,
      affinity: transientSkill.affinity,
      variants: transientSkill.variants,
      createdAt: transientSkill.createdAt,
      updatedAt: transientSkill.updatedAt
    });
  }

  public static create(props: SkillCreateProps) {
    return new Skill({
      ...props,
      id: generateUuid(),
      key: TransientSkill.normalizeName(props.name),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  public refresh(props: SkillRefreshProps) {
    ObjectUtil.assignAllIfDefined(this, props);
  }
}
