import { NotFoundError } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Education, type EducationRepository, EntityNotFoundError } from '@tailoredin/domain';

@injectable()
export class PostgresEducationRepository implements EducationRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<Education[]> {
    return this.orm.em.findAll(Education, { orderBy: { ordinal: 'ASC' } });
  }

  public async findByIdOrFail(id: string): Promise<Education> {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
      return await this.orm.em.findOneOrFail(Education, { id } as any);
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
      // biome-ignore lint/suspicious/noExplicitAny: MikroORM FilterQuery type mismatch with custom PK
      const orm = await this.orm.em.findOneOrFail(Education, { id } as any);
      this.orm.em.remove(orm);
      await this.orm.em.flush();
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Education', id);
      throw e;
    }
  }
}
