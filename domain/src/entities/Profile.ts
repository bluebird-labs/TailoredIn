import { AggregateRoot } from '../AggregateRoot.js';
import { ProfileId } from '../value-objects/ProfileId.js';

export type ProfileCreateProps = {
  email: string;
  firstName: string;
  lastName: string;
  about: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

export class Profile extends AggregateRoot<ProfileId> {
  public email: string;
  public firstName: string;
  public lastName: string;
  public about: string | null;
  public phone: string | null;
  public githubUrl: string | null;
  public linkedinUrl: string | null;
  public websiteUrl: string | null;
  public location: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ProfileId;
    email: string;
    firstName: string;
    lastName: string;
    about: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.about = props.about;
    this.phone = props.phone;
    this.location = props.location;
    this.linkedinUrl = props.linkedinUrl;
    this.githubUrl = props.githubUrl;
    this.websiteUrl = props.websiteUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public static create(props: ProfileCreateProps): Profile {
    const now = new Date();
    return new Profile({
      id: ProfileId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
