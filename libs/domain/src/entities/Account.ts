import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AggregateRoot } from '../AggregateRoot.js';
import type { PasswordHasher } from '../ports/PasswordHasher.js';
import { ValidationError } from '../ValidationError.js';

export type AccountCreateProps = {
  email: string;
  passwordHash: string;
  profileId: string;
};

@Entity({ tableName: 'accounts' })
export class Account extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'email', type: 'text' })
  public email: string;

  @Property({ fieldName: 'password_hash', type: 'text' })
  public passwordHash: string;

  @Property({ fieldName: 'profile_id', type: 'uuid' })
  public profileId: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    email: string;
    passwordHash: string;
    profileId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.email || !/^.+@.+\..+$/.test(props.email))
      throw new ValidationError('email', 'must be a valid email address');
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.profileId = props.profileId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public async verifyPassword(plaintext: string, hasher: PasswordHasher): Promise<boolean> {
    return hasher.verify(plaintext, this.passwordHash);
  }

  public static create(props: AccountCreateProps): Account {
    const now = new Date();
    return new Account({
      id: crypto.randomUUID(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
