import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { Entity as DomainEntity } from '../Entity.js';
import { Experience } from './Experience.js';

export type ExperienceSkillCreateProps = {
  experienceId: string;
  skillId: string;
};

@Entity({ tableName: 'experience_skills' })
export class ExperienceSkill extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  // @ts-expect-error — MikroORM decorator types don't support mapToPk with string PKs; required for @OneToMany on Experience
  @ManyToOne(() => Experience, { fieldName: 'experience_id', mapToPk: true })
  public readonly experienceId: string;

  @Property({ fieldName: 'skill_id', type: 'uuid' })
  public readonly skillId: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  public constructor(props: { id: string; experienceId: string; skillId: string; createdAt: Date }) {
    super();
    this.id = props.id;
    this.experienceId = props.experienceId;
    this.skillId = props.skillId;
    this.createdAt = props.createdAt;
  }

  public static create(props: ExperienceSkillCreateProps): ExperienceSkill {
    return new ExperienceSkill({
      id: crypto.randomUUID(),
      ...props,
      createdAt: new Date()
    });
  }
}
