import { NotFoundError } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { Education, type EducationRepository, EntityNotFoundError } from '@tailoredin/domain';

@Injectable()
export class PostgresEducationRepository implements EducationRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findAll(): Promise<Education[]> {
    return this.orm.em.findAll(Education, { orderBy: { ordinal: 'ASC' } });
  }

  public async findByIdOrFail(id: string): Promise<Education> {
    try {
      return await this.orm.em.findOneOrFail(Education, { id });
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Education', id);
      throw e;
    }
  }

  public async save(education: Education): Promise<void> {
    this.orm.em.persist(education);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    try {
      const orm = await this.orm.em.findOneOrFail(Education, { id });
      this.orm.em.remove(orm);
      await this.orm.em.flush();
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Education', id);
      throw e;
    }
  }
}
