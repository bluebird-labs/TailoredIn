import { inject, injectable } from '@needle-di/core';
import type { DeleteSkillItem } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteSkillItemRoute {
  public constructor(private readonly deleteSkillItem: DeleteSkillItem = inject(DI.Resume.DeleteSkillItem)) {}

  public plugin() {
    return new Elysia().delete(
      '/resume/skills/:id/items/:itemId',
      async ({ params, set }) => {
        const result = await this.deleteSkillItem.execute({
          categoryId: params.id,
          itemId: params.itemId
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }), itemId: t.String({ format: 'uuid' }) })
      }
    );
  }
}
