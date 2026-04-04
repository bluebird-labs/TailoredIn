import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';

type ProfileProps = {
  id: string;
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
};

type ProfileCreateProps = Omit<ProfileProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'profiles' })
export class Profile extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'email', type: 'text' })
  public email: string;

  @Property({ name: 'first_name', type: 'text' })
  public firstName: string;

  @Property({ name: 'last_name', type: 'text' })
  public lastName: string;

  @Property({ name: 'about', type: 'text', nullable: true })
  public about: string | null;

  @Property({ name: 'phone', type: 'text', nullable: true })
  public phone: string | null;

  @Property({ name: 'location', type: 'text', nullable: true })
  public location: string | null;

  @Property({ name: 'linkedin_url', type: 'text', nullable: true })
  public linkedinUrl: string | null;

  @Property({ name: 'github_url', type: 'text', nullable: true })
  public githubUrl: string | null;

  @Property({ name: 'website_url', type: 'text', nullable: true })
  public websiteUrl: string | null;

  public constructor(props: ProfileProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.about = props.about;
    this.phone = props.phone;
    this.location = props.location;
    this.linkedinUrl = props.linkedinUrl;
    this.githubUrl = props.githubUrl;
    this.websiteUrl = props.websiteUrl;
  }

  public static create(props: ProfileCreateProps): Profile {
    const now = new Date();
    return new Profile({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
