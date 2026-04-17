import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';

export type EducationCreateProps = {
  profileId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
  hiddenByDefault?: boolean;
};

@Entity({ tableName: 'educations' })
export class Education extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'profile_id', type: 'uuid' })
  public readonly profileId: string;

  @Property({ fieldName: 'degree_title', type: 'text' })
  public degreeTitle: string;

  @Property({ fieldName: 'institution_name', type: 'text' })
  public institutionName: string;

  @Property({ fieldName: 'graduation_year', type: 'integer' })
  public graduationYear: number;

  @Property({ fieldName: 'location', type: 'text', nullable: true })
  public location: string | null;

  @Property({ fieldName: 'honors', type: 'text', nullable: true })
  public honors: string | null;

  @Property({ fieldName: 'ordinal', type: 'integer' })
  public ordinal: number;

  @Property({ fieldName: 'hidden_by_default', type: 'boolean' })
  public hiddenByDefault: boolean;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    profileId: string;
    degreeTitle: string;
    institutionName: string;
    graduationYear: number;
    location: string | null;
    honors: string | null;
    ordinal: number;
    hiddenByDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.degreeTitle || props.degreeTitle.length > 500)
      throw new ValidationError('degreeTitle', 'must be between 1 and 500 characters');
    if (!props.institutionName || props.institutionName.length > 500)
      throw new ValidationError('institutionName', 'must be between 1 and 500 characters');
    if (props.graduationYear < 1900 || props.graduationYear > 2100)
      throw new ValidationError('graduationYear', 'must be between 1900 and 2100');
    this.id = props.id;
    this.profileId = props.profileId;
    this.degreeTitle = props.degreeTitle;
    this.institutionName = props.institutionName;
    this.graduationYear = props.graduationYear;
    this.location = props.location;
    this.honors = props.honors;
    this.ordinal = props.ordinal;
    this.hiddenByDefault = props.hiddenByDefault;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: EducationCreateProps): Education {
    const now = new Date();
    return new Education({
      id: crypto.randomUUID(),
      ...props,
      hiddenByDefault: props.hiddenByDefault ?? false,
      createdAt: now,
      updatedAt: now
    });
  }
}
