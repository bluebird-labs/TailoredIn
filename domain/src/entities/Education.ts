import { AggregateRoot } from '../AggregateRoot.js';
import { EducationId } from '../value-objects/EducationId.js';

export type EducationCreateProps = {
  profileId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

export class Education extends AggregateRoot<EducationId> {
  public readonly profileId: string;
  public degreeTitle: string;
  public institutionName: string;
  public graduationYear: number;
  public location: string | null;
  public honors: string | null;
  public ordinal: number;
  public readonly createdAt: Date;
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
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.degreeTitle = props.degreeTitle;
    this.institutionName = props.institutionName;
    this.graduationYear = props.graduationYear;
    this.location = props.location;
    this.honors = props.honors;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: EducationCreateProps): Education {
    const now = new Date();
    return new Education({
      id: EducationId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
