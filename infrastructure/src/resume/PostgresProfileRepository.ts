import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Profile, type ProfileRepository } from '@tailoredin/domain';

@injectable()
export class PostgresProfileRepository implements ProfileRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findSingle(): Promise<Profile> {
    const [profile] = await this.orm.em.findAll(Profile, { limit: 1 });
    if (!profile) throw new Error('No profile found');
    return profile;
  }

  public async save(profile: Profile): Promise<void> {
    this.orm.em.persist(profile);
    await this.orm.em.flush();
  }
}
