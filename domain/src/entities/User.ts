import { Entity } from '../Entity.js';
import { UserId } from '../value-objects/UserId.js';

export type UserCreateProps = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  githubHandle: string | null;
  linkedinHandle: string | null;
  locationLabel: string | null;
};

export class User extends Entity<UserId> {
  public email: string;
  public firstName: string;
  public lastName: string;
  public phoneNumber: string | null;
  public githubHandle: string | null;
  public linkedinHandle: string | null;
  public locationLabel: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: {
    id: UserId;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    githubHandle: string | null;
    linkedinHandle: string | null;
    locationLabel: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phoneNumber = props.phoneNumber;
    this.githubHandle = props.githubHandle;
    this.linkedinHandle = props.linkedinHandle;
    this.locationLabel = props.locationLabel;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: UserCreateProps): User {
    const now = new Date();
    return new User({
      id: UserId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
