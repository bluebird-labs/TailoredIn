import { AggregateRoot } from '../AggregateRoot.js';
import { ResumeContentId } from '../value-objects/ResumeContentId.js';
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

export class ResumeContent extends AggregateRoot<ResumeContentId> {
  public readonly profileId: string;
  public readonly jobDescriptionId: string;
  public readonly headline: string;
  public readonly experiences: ResumeExperience[];
  public readonly hiddenEducationIds: string[];
  public readonly prompt: string;
  public readonly schema: Record<string, unknown> | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public constructor(props: {
    id: ResumeContentId;
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
    super(props.id);
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
      id: ResumeContentId.generate(),
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
