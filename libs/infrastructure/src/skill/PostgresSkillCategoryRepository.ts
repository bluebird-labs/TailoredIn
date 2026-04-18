import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundError, SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresSkillCategoryRepository implements SkillCategoryRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findAll(): Promise<SkillCategory[]> {
    return this.orm.em.find(SkillCategory, {}, { orderBy: { label: 'ASC' } });
  }

  public async findByIdOrFail(id: string): Promise<SkillCategory> {
    const category = await this.orm.em.findOne(SkillCategory, { id });
    if (!category) throw new EntityNotFoundError('SkillCategory', id);
    return category;
  }
}
