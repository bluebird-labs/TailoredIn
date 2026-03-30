import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import { User as DomainUser, UserId, type UserRepository } from '@tailoredin/domain';
import { User as OrmUser } from '../db/entities/users/User.js';

@injectable()
export class PostgresUserRepository implements UserRepository {
  public constructor(private readonly orm: MikroORM) {}

  public async findByIdOrFail(id: string): Promise<DomainUser> {
    const orm = await this.orm.em.findOneOrFail(OrmUser, id);
    return this.toDomain(orm);
  }

  public async findSingle(): Promise<DomainUser> {
    const [orm] = await this.orm.em.findAll(OrmUser, { limit: 1 });
    if (!orm) throw new Error('No user found');
    return this.toDomain(orm);
  }

  public async save(user: DomainUser): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmUser, user.id.value);
    orm.email = user.email;
    orm.firstName = user.firstName;
    orm.lastName = user.lastName;
    orm.phoneNumber = user.phoneNumber;
    orm.githubHandle = user.githubHandle;
    orm.linkedinHandle = user.linkedinHandle;
    orm.locationLabel = user.locationLabel;
    orm.updatedAt = user.updatedAt;
    this.orm.em.persist(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmUser): DomainUser {
    return new DomainUser({
      id: new UserId(orm.id),
      email: orm.email,
      firstName: orm.firstName,
      lastName: orm.lastName,
      phoneNumber: orm.phoneNumber,
      githubHandle: orm.githubHandle,
      linkedinHandle: orm.linkedinHandle,
      locationLabel: orm.locationLabel,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
