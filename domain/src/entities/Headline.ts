import { AggregateRoot } from '../AggregateRoot.js';
import { HeadlineId } from '../value-objects/HeadlineId.js';

export type HeadlineCreateProps = {
  profileId: string;
  label: string;
  summaryText: string;
};

export class Headline extends AggregateRoot<HeadlineId> {
  public readonly profileId: string;
  public label: string;
  public summaryText: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: HeadlineId;
    profileId: string;
    label: string;
    summaryText: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.label = props.label;
    this.summaryText = props.summaryText;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: HeadlineCreateProps): Headline {
    const now = new Date();
    return new Headline({
      id: HeadlineId.generate(),
      profileId: props.profileId,
      label: props.label,
      summaryText: props.summaryText,
      createdAt: now,
      updatedAt: now
    });
  }
}
