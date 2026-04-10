import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import type { ResumeExperience } from '../value-objects/ResumeExperience.js';

export type ResumeContentCreateProps = {
  profileId: string;
  jobDescriptionId: string;
  headline: string;
  experiences: ResumeExperience[];
  hiddenEducationIds?: string[];
  prompt: string;
  schema: Record<string, unknown> | null;
};

@Entity({ tableName: 'resume_contents' })
export class ResumeContent extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ fieldName: 'job_description_id', type: 'uuid' })
  public readonly jobDescriptionId: string;

  @Property({ fieldName: 'headline', type: 'text' })
  public readonly headline: string;

  @Property({ fieldName: 'experiences', type: 'jsonb' })
  public readonly experiences: ResumeExperience[];

  @Property({ fieldName: 'hidden_education_ids', type: 'jsonb' })
  public readonly hiddenEducationIds: string[];

  @Property({ fieldName: 'prompt', type: 'text' })
  public readonly prompt: string;

  @Property({ fieldName: 'schema', type: 'jsonb', nullable: true })
  public readonly schema: Record<string, unknown> | null;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly updatedAt: Date;

  public constructor(props: {
    id: string;
    profileId: string;
    jobDescriptionId: string;
    headline: string;
    experiences: ResumeExperience[];
    hiddenEducationIds: string[];
    prompt: string;
    schema: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.id = props.id;
    this.profileId = props.profileId;
    this.jobDescriptionId = props.jobDescriptionId;
    this.headline = props.headline;
    this.experiences = props.experiences;
    this.hiddenEducationIds = props.hiddenEducationIds;
    this.prompt = props.prompt;
    this.schema = props.schema;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ResumeContentCreateProps): ResumeContent {
    const now = new Date();
    return new ResumeContent({
      id: crypto.randomUUID(),
      profileId: props.profileId,
      jobDescriptionId: props.jobDescriptionId,
      headline: props.headline,
      experiences: props.experiences,
      hiddenEducationIds: props.hiddenEducationIds ?? [],
      prompt: props.prompt,
      schema: props.schema,
      createdAt: now,
      updatedAt: now
    });
  }

  public withExperienceHiddenBullets(experienceId: string, hiddenBulletIndices: number[]): ResumeContent {
    const experiences = this.experiences.map(e =>
      e.experienceId === experienceId ? { ...e, hiddenBulletIndices } : e
    );
    return new ResumeContent({
      id: this.id,
      profileId: this.profileId,
      jobDescriptionId: this.jobDescriptionId,
      headline: this.headline,
      experiences,
      hiddenEducationIds: this.hiddenEducationIds,
      prompt: this.prompt,
      schema: this.schema,
      createdAt: this.createdAt,
      updatedAt: new Date()
    });
  }

  public withHiddenEducationIds(ids: string[]): ResumeContent {
    return new ResumeContent({
      id: this.id,
      profileId: this.profileId,
      jobDescriptionId: this.jobDescriptionId,
      headline: this.headline,
      experiences: this.experiences,
      hiddenEducationIds: ids,
      prompt: this.prompt,
      schema: this.schema,
      createdAt: this.createdAt,
      updatedAt: new Date()
    });
  }
}
