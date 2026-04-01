import { AggregateRoot } from '../AggregateRoot.js';
import { HeadlineId } from '../value-objects/HeadlineId.js';
import type { Tag } from './Tag.js';

export type HeadlineCreateProps = {
  profileId: string;
  label: string;
  summaryText: string;
  roleTags?: Tag[];
};

export class Headline extends AggregateRoot<HeadlineId> {
  public readonly profileId: string;
  public label: string;
  public summaryText: string;
  public roleTags: Tag[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: HeadlineId;
    profileId: string;
    label: string;
    summaryText: string;
    roleTags: Tag[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.label = props.label;
    this.summaryText = props.summaryText;
    this.roleTags = props.roleTags;
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
      roleTags: props.roleTags ?? [],
      createdAt: now,
      updatedAt: now
    });
  }
}
