import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AggregateRoot } from '../AggregateRoot.js';
import { ProfileIdType } from '../orm-types/ProfileIdType.js';
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

@Entity({ tableName: 'profiles' })
export class Profile extends AggregateRoot<ProfileId> {
  @PrimaryKey({ type: ProfileIdType, fieldName: 'id' })
  public declare readonly id: ProfileId;

  @Property({ fieldName: 'email', type: 'text' })
  public email: string;

  @Property({ fieldName: 'first_name', type: 'text' })
  public firstName: string;

  @Property({ fieldName: 'last_name', type: 'text' })
  public lastName: string;

  @Property({ fieldName: 'about', type: 'text', nullable: true })
  public about: string | null;

  @Property({ fieldName: 'phone', type: 'text', nullable: true })
  public phone: string | null;

  @Property({ fieldName: 'github_url', type: 'text', nullable: true })
  public githubUrl: string | null;

  @Property({ fieldName: 'linkedin_url', type: 'text', nullable: true })
  public linkedinUrl: string | null;

  @Property({ fieldName: 'website_url', type: 'text', nullable: true })
  public websiteUrl: string | null;

  @Property({ fieldName: 'location', type: 'text', nullable: true })
  public location: string | null;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
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
