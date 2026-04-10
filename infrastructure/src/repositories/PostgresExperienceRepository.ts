import { NotFoundError } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { EntityNotFoundError, Experience, type ExperienceRepository } from '@tailoredin/domain';

@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<Experience> {
    try {
      return await this.orm.em.findOneOrFail(Experience, { id }, { populate: ['accomplishments'] });
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Experience', id);
      throw e;
    }
  }

  public async findAll(): Promise<Experience[]> {
    return this.orm.em.find(Experience, {}, { orderBy: { ordinal: 'ASC' }, populate: ['accomplishments'] });
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
