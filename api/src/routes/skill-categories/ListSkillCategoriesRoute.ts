import { inject, injectable } from '@needle-di/core';
import type { ListSkillCategories } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListSkillCategoriesRoute {
  public constructor(
    private readonly listSkillCategories: ListSkillCategories = inject(DI.SkillCategory.ListSkillCategories)
  ) {}

  public plugin() {
    return new Elysia().get('/skill-categories', async () => {
      const data = await this.listSkillCategories.execute();
      return { data };
    });
  }
}
