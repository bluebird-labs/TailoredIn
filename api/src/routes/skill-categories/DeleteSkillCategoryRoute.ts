import { inject, injectable } from '@needle-di/core';
import type { DeleteSkillCategory } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteSkillCategoryRoute {
  public constructor(
    private readonly deleteSkillCategory: DeleteSkillCategory = inject(DI.SkillCategory.DeleteSkillCategory)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/skill-categories/:id',
      async ({ params, set }) => {
        const result = await this.deleteSkillCategory.execute({ categoryId: params.id });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
