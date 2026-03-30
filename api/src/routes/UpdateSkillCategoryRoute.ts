import { inject, injectable } from '@needle-di/core';
import type { UpdateSkillCategory } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateSkillCategoryRoute {
  public constructor(
    private readonly updateSkillCategory: UpdateSkillCategory = inject(DI.Resume.UpdateSkillCategory)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/resume/skills/:id',
      async ({ params, body, set }) => {
        const result = await this.updateSkillCategory.execute({
          categoryId: params.id,
          categoryName: body.category_name,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          category_name: t.Optional(t.String({ minLength: 1 })),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
