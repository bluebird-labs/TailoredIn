import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { User } from '../users/User.js';

export type ResumeEducationProps = {
  id: string;
  user: RefOrEntity<User>;
  degreeTitle: string;
  institutionName: string;
  graduationYear: string;
  locationLabel: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeEducationCreateProps = Omit<ResumeEducationProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'resume_education' })
export class ResumeEducation extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => User, { lazy: true, name: 'user_id' })
  public readonly user: RefOrEntity<User>;

  @Property({ name: 'degree_title', type: 'text' })
  public degreeTitle: string;

  @Property({ name: 'institution_name', type: 'text' })
  public institutionName: string;

  @Property({ name: 'graduation_year', type: 'text' })
  public graduationYear: string;

  @Property({ name: 'location_label', type: 'text' })
  public locationLabel: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  constructor(props: ResumeEducationProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.user = props.user;
    this.degreeTitle = props.degreeTitle;
    this.institutionName = props.institutionName;
    this.graduationYear = props.graduationYear;
    this.locationLabel = props.locationLabel;
    this.ordinal = props.ordinal;
  }

  static create(props: ResumeEducationCreateProps): ResumeEducation {
    const now = new Date();
    return new ResumeEducation({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
