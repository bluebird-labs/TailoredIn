import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { User } from '../users/User.js';

export type ResumeHeadlineProps = {
  id: string;
  user: RefOrEntity<User>;
  headlineLabel: string;
  summaryText: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeHeadlineCreateProps = Omit<ResumeHeadlineProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_headlines' })
export class ResumeHeadline extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => User, { lazy: true, name: 'user_id' })
  public readonly user: RefOrEntity<User>;

  @Property({ name: 'headline_label', type: 'text' })
  public headlineLabel: string;

  @Property({ name: 'summary_text', type: 'text' })
  public summaryText: string;

  public constructor(props: ResumeHeadlineProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.user = props.user;
    this.headlineLabel = props.headlineLabel;
    this.summaryText = props.summaryText;
  }

  public static create(props: ResumeHeadlineCreateProps): ResumeHeadline {
    const now = new Date();
    return new ResumeHeadline({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
