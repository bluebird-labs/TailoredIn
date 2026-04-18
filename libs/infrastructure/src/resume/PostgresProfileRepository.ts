import { MikroORM } from '@mikro-orm/core';
import { NotFoundError } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundError, Profile, type ProfileRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresProfileRepository implements ProfileRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

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
