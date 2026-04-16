import { MikroORM, NotFoundError } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { EntityNotFoundError, Profile, type ProfileRepository } from '@tailoredin/domain';

@injectable()
export class PostgresProfileRepository implements ProfileRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<Profile> {
    try {
      return await this.orm.em.findOneOrFail(Profile, { id });
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Profile', id);
      throw e;
    }
  }

  public async save(profile: Profile): Promise<void> {
    this.orm.em.persist(profile);
    await this.orm.em.flush();
  }
}
