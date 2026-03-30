import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';

export type UserProps = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  githubHandle: string | null;
  linkedinHandle: string | null;
  locationLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCreateProps = Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'email', type: 'text', unique: 'users_email_key' })
  public email: string;

  @Property({ name: 'first_name', type: 'text' })
  public firstName: string;

  @Property({ name: 'last_name', type: 'text' })
  public lastName: string;

  @Property({ name: 'phone_number', type: 'text', nullable: true })
  public phoneNumber: string | null;

  @Property({ name: 'github_handle', type: 'text', nullable: true })
  public githubHandle: string | null;

  @Property({ name: 'linkedin_handle', type: 'text', nullable: true })
  public linkedinHandle: string | null;

  @Property({ name: 'location_label', type: 'text', nullable: true })
  public locationLabel: string | null;

  public constructor(props: UserProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phoneNumber = props.phoneNumber;
    this.githubHandle = props.githubHandle;
    this.linkedinHandle = props.linkedinHandle;
    this.locationLabel = props.locationLabel;
  }

  public static create(props: UserCreateProps): User {
    const now = new Date();
    return new User({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
