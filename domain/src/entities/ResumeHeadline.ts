import { Entity } from '../Entity.js';
import { ResumeHeadlineId } from '../value-objects/ResumeHeadlineId.js';

export type ResumeHeadlineCreateProps = {
  userId: string;
  headlineLabel: string;
  summaryText: string;
};

export class ResumeHeadline extends Entity<ResumeHeadlineId> {
  public readonly userId: string;
  public headlineLabel: string;
  public summaryText: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ResumeHeadlineId;
    userId: string;
    headlineLabel: string;
    summaryText: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.userId = props.userId;
    this.headlineLabel = props.headlineLabel;
    this.summaryText = props.summaryText;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ResumeHeadlineCreateProps): ResumeHeadline {
    const now = new Date();
    return new ResumeHeadline({
      id: ResumeHeadlineId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
