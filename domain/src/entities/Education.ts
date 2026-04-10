import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import { EducationIdType } from '../orm-types/EducationIdType.js';
import { EducationId } from '../value-objects/EducationId.js';
import { Profile } from './Profile.js';

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
export class Education extends AggregateRoot<EducationId> {
  @PrimaryKey({ type: EducationIdType, fieldName: 'id' })
  public readonly id!: EducationId;

  // @ts-expect-error — mapToPk narrows to string but decorator expects entity type
  @ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })
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
    id: EducationId;
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
    super(props.id);
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
      id: EducationId.generate(),
      ...props,
      hiddenByDefault: props.hiddenByDefault ?? false,
      createdAt: now,
      updatedAt: now
    });
  }
}
