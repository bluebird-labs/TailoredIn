import { AggregateRoot } from '../AggregateRoot.js';
import { ResumeContentId } from '../value-objects/ResumeContentId.js';
import type { ResumeExperience } from '../value-objects/ResumeExperience.js';

export type ResumeContentCreateProps = {
  profileId: string;
  jobDescriptionId: string;
  headline: string;
  experiences: ResumeExperience[];
  prompt: string;
  schema: Record<string, unknown> | null;
};

export class ResumeContent extends AggregateRoot<ResumeContentId> {
  public readonly profileId: string;
  public readonly jobDescriptionId: string;
  public readonly headline: string;
  public readonly experiences: ResumeExperience[];
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
      prompt: props.prompt,
      schema: props.schema,
      createdAt: now,
      updatedAt: now
    });
  }
}
