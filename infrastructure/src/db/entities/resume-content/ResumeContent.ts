import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import type { Ref } from '@mikro-orm/postgresql';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { JobDescription } from '../job-description/JobDescription.js';
import { Profile } from '../profile/Profile.js';

type ResumeExperienceJson = {
  experienceId: string;
  summary: string;
  bullets: string[];
  hiddenBulletIndices?: number[];
};

@Entity({ tableName: 'resume_contents' })
export class ResumeContent extends BaseEntity {
  @UuidPrimaryKey({ fieldName: 'id' })
  public id: string;

  @ManyToOne(() => Profile, { lazy: true, fieldName: 'profile_id' })
  public readonly profile: Ref<Profile> | Profile;

  @ManyToOne(() => JobDescription, { lazy: true, fieldName: 'job_description_id' })
  public readonly jobDescription: Ref<JobDescription> | JobDescription;

  @Property({ fieldName: 'headline', type: 'text' })
  public headline: string;

  @Property({ fieldName: 'experiences', type: 'jsonb' })
  public experiences: ResumeExperienceJson[];

  @Property({ fieldName: 'hidden_education_ids', type: 'jsonb' })
  public hiddenEducationIds: string[];

  @Property({ fieldName: 'prompt', type: 'text' })
  public prompt: string;

  @Property({ fieldName: 'schema', type: 'jsonb', nullable: true })
  public schema: Record<string, unknown> | null;

  public constructor(props: {
    id: string;
    profile: Ref<Profile> | Profile;
    jobDescription: Ref<JobDescription> | JobDescription;
    headline: string;
    experiences: ResumeExperienceJson[];
    hiddenEducationIds: string[];
    prompt: string;
    schema: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.jobDescription = props.jobDescription;
    this.headline = props.headline;
    this.experiences = props.experiences;
    this.hiddenEducationIds = props.hiddenEducationIds;
    this.prompt = props.prompt;
    this.schema = props.schema;
  }
}
