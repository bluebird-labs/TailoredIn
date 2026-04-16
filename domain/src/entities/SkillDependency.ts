import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { Entity as DomainEntity } from '../Entity.js';

export type SkillDependencyCreateProps = {
  skillId: string;
  impliedSkillId: string;
};

@Entity({ tableName: 'skill_dependencies' })
export class SkillDependency extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'skill_id', type: 'uuid' })
  public readonly skillId: string;

  @Property({ fieldName: 'implied_skill_id', type: 'uuid' })
  public readonly impliedSkillId: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  public constructor(props: { id: string; skillId: string; impliedSkillId: string; createdAt: Date }) {
    super();
    this.id = props.id;
    this.skillId = props.skillId;
    this.impliedSkillId = props.impliedSkillId;
    this.createdAt = props.createdAt;
  }

  public static create(props: SkillDependencyCreateProps): SkillDependency {
    return new SkillDependency({
      id: crypto.randomUUID(),
      ...props,
      createdAt: new Date()
    });
  }
}
