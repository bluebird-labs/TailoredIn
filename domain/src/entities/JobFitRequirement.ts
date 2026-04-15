import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { Entity as DomainEntity } from '../Entity.js';
import { ValidationError } from '../ValidationError.js';
import type { RequirementCoverage } from '../value-objects/ResumeScore.js';
import { JobFitScore } from './JobFitScore.js';

export type JobFitRequirementCreateProps = {
  jobFitScoreId: string;
  requirement: string;
  coverage: RequirementCoverage;
  reasoning: string;
  ordinal: number;
};

@Entity({ tableName: 'job_fit_requirements' })
export class JobFitRequirement extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  // @ts-expect-error — MikroORM decorator types don't support mapToPk with string PKs; required for @OneToMany on JobFitScore
  @ManyToOne(() => JobFitScore, { fieldName: 'job_fit_score_id', mapToPk: true })
  public readonly jobFitScoreId: string;

  @Property({ fieldName: 'requirement', type: 'text' })
  public readonly requirement: string;

  @Property({ fieldName: 'coverage', type: 'text' })
  public readonly coverage: RequirementCoverage;

  @Property({ fieldName: 'reasoning', type: 'text' })
  public readonly reasoning: string;

  @Property({ fieldName: 'ordinal', type: 'integer' })
  public readonly ordinal: number;

  public constructor(props: {
    id: string;
    jobFitScoreId: string;
    requirement: string;
    coverage: RequirementCoverage;
    reasoning: string;
    ordinal: number;
  }) {
    super();
    if (!props.requirement || props.requirement.length > 5000)
      throw new ValidationError('requirement', 'must be between 1 and 5000 characters');
    if (!props.reasoning || props.reasoning.length > 10000)
      throw new ValidationError('reasoning', 'must be between 1 and 10000 characters');
    if (!['strong', 'partial', 'not_evidenced', 'absent'].includes(props.coverage))
      throw new ValidationError('coverage', "must be 'strong', 'partial', 'not_evidenced', or 'absent'");
    this.id = props.id;
    this.jobFitScoreId = props.jobFitScoreId;
    this.requirement = props.requirement;
    this.coverage = props.coverage;
    this.reasoning = props.reasoning;
    this.ordinal = props.ordinal;
  }

  public static create(props: JobFitRequirementCreateProps): JobFitRequirement {
    return new JobFitRequirement({
      id: crypto.randomUUID(),
      ...props
    });
  }
}
