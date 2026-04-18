import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundError, Experience, type ExperienceRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findByIdOrFail(id: string): Promise<Experience> {
    try {
      return await this.orm.em.findOneOrFail(Experience, { id }, { populate: ['accomplishments', 'skills'] });
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Experience', id);
      throw e;
    }
  }

  public async findAll(): Promise<Experience[]> {
    return this.orm.em.find(Experience, {}, { orderBy: { ordinal: 'ASC' }, populate: ['accomplishments', 'skills'] });
  }

  public async save(experience: Experience): Promise<void> {
    this.orm.em.persist(experience);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    try {
      const exp = await this.orm.em.findOneOrFail(Experience, { id });
      this.orm.em.remove(exp);
      await this.orm.em.flush();
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Experience', id);
      throw e;
    }
  }
}
