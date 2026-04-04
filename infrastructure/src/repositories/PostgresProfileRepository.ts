import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Profile as DomainProfile, ProfileId, type ProfileRepository } from '@tailoredin/domain';
import { Profile as OrmProfile } from '../db/entities/profile/Profile.js';

@injectable()
export class PostgresProfileRepository implements ProfileRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findSingle(): Promise<DomainProfile> {
    const [orm] = await this.orm.em.findAll(OrmProfile, { limit: 1 });
    if (!orm) throw new Error('No profile found');
    return this.toDomain(orm);
  }

  public async save(profile: DomainProfile): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmProfile, profile.id.value);
    orm.email = profile.email;
    orm.firstName = profile.firstName;
    orm.lastName = profile.lastName;
    orm.about = profile.about;
    orm.phone = profile.phone;
    orm.location = profile.location;
    orm.linkedinUrl = profile.linkedinUrl;
    orm.githubUrl = profile.githubUrl;
    orm.websiteUrl = profile.websiteUrl;
    orm.updatedAt = profile.updatedAt;
    this.orm.em.persist(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmProfile): DomainProfile {
    return new DomainProfile({
      id: new ProfileId(orm.id),
      email: orm.email,
      firstName: orm.firstName,
      lastName: orm.lastName,
      about: orm.about,
      phone: orm.phone,
      location: orm.location,
      linkedinUrl: orm.linkedinUrl,
      githubUrl: orm.githubUrl,
      websiteUrl: orm.websiteUrl,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
