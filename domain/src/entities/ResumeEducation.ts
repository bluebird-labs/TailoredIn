import { Entity } from '../Entity.js';
import { ResumeEducationId } from '../value-objects/ResumeEducationId.js';

export type ResumeEducationCreateProps = {
  userId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: string;
  locationLabel: string;
  ordinal: number;
};

export class ResumeEducation extends Entity<ResumeEducationId> {
  public readonly userId: string;
  public degreeTitle: string;
  public institutionName: string;
  public graduationYear: string;
  public locationLabel: string;
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ResumeEducationId;
    userId: string;
    degreeTitle: string;
    institutionName: string;
    graduationYear: string;
    locationLabel: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.userId = props.userId;
    this.degreeTitle = props.degreeTitle;
    this.institutionName = props.institutionName;
    this.graduationYear = props.graduationYear;
    this.locationLabel = props.locationLabel;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ResumeEducationCreateProps): ResumeEducation {
    const now = new Date();
    return new ResumeEducation({
      id: ResumeEducationId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
