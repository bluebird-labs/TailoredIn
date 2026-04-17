import { Collection } from '@mikro-orm/core';
import { Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';
import type { RequirementCoverage } from '../value-objects/ResumeScore.js';
import { JobFitRequirement } from './JobFitRequirement.js';

export type JobFitScoreCreateProps = {
  profileId: string;
  jobDescriptionId: string;
  overall: number;
  summary: string;
  requirements: Array<{
    requirement: string;
    coverage: RequirementCoverage;
    reasoning: string;
  }>;
};

@Entity({ tableName: 'job_fit_scores' })
export class JobFitScore extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ fieldName: 'job_description_id', type: 'uuid' })
  public readonly jobDescriptionId: string;

  @Property({ fieldName: 'overall', type: 'integer' })
  public readonly overall: number;

  @Property({ fieldName: 'summary', type: 'text' })
  public readonly summary: string;

  @OneToMany(
    () => JobFitRequirement,
    req => req.jobFitScoreId,
    {
      orphanRemoval: true,
      orderBy: { ordinal: 'ASC' }
    }
  )
  public readonly requirements = new Collection<JobFitRequirement>(this);

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  public constructor(props: {
    id: string;
    profileId: string;
    jobDescriptionId: string;
    overall: number;
    summary: string;
    createdAt: Date;
  }) {
    super();
    if (props.overall < 0 || props.overall > 100) throw new ValidationError('overall', 'must be between 0 and 100');
    if (!props.summary || props.summary.length > 10000)
      throw new ValidationError('summary', 'must be between 1 and 10000 characters');
    this.id = props.id;
    this.profileId = props.profileId;
    this.jobDescriptionId = props.jobDescriptionId;
    this.overall = props.overall;
    this.summary = props.summary;
    this.createdAt = props.createdAt;
  }

  public static create(props: JobFitScoreCreateProps): JobFitScore {
    const id = crypto.randomUUID();
    const now = new Date();
    const score = new JobFitScore({
      id,
      profileId: props.profileId,
      jobDescriptionId: props.jobDescriptionId,
      overall: props.overall,
      summary: props.summary,
      createdAt: now
    });

    for (let i = 0; i < props.requirements.length; i++) {
      const req = props.requirements[i];
      score.requirements.add(
        JobFitRequirement.create({
          jobFitScoreId: id,
          requirement: req.requirement,
          coverage: req.coverage,
          reasoning: req.reasoning,
          ordinal: i
        })
      );
    }

    return score;
  }
}
