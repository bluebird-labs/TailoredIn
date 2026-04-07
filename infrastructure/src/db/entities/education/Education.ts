import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Profile } from '../profile/Profile.js';

type EducationProps = {
  id: string;
  profile: RefOrEntity<Profile>;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
  hiddenByDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type EducationCreateProps = Omit<EducationProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'educations' })
export class Education extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Profile, { lazy: true, name: 'profile_id' })
  public readonly profile: RefOrEntity<Profile>;

  @Property({ name: 'degree_title', type: 'text' })
  public degreeTitle: string;

  @Property({ name: 'institution_name', type: 'text' })
  public institutionName: string;

  @Property({ name: 'graduation_year', type: 'integer' })
  public graduationYear: number;

  @Property({ name: 'location', type: 'text', nullable: true })
  public location: string | null;

  @Property({ name: 'honors', type: 'text', nullable: true })
  public honors: string | null;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @Property({ name: 'hidden_by_default', type: 'boolean' })
  public hiddenByDefault: boolean;

  public constructor(props: EducationProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.degreeTitle = props.degreeTitle;
    this.institutionName = props.institutionName;
    this.graduationYear = props.graduationYear;
    this.location = props.location;
    this.honors = props.honors;
    this.ordinal = props.ordinal;
    this.hiddenByDefault = props.hiddenByDefault;
  }

  public static create(props: EducationCreateProps): Education {
    const now = new Date();
    return new Education({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
