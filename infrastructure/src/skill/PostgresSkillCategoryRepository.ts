import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { EntityNotFoundError, SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

@injectable()
export class PostgresSkillCategoryRepository implements SkillCategoryRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<SkillCategory[]> {
    return this.orm.em.find(SkillCategory, {}, { orderBy: { ordinal: 'ASC' } });
  }

  public async findByIdOrFail(id: string): Promise<SkillCategory> {
    const category = await this.orm.em.findOne(SkillCategory, { id });
    if (!category) throw new EntityNotFoundError('SkillCategory', id);
    return category;
  }
}
