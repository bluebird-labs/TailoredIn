import { inject, injectable } from '@needle-di/core';
import type { UpdateSkillItem } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateSkillItemRoute {
  public constructor(private readonly updateSkillItem: UpdateSkillItem = inject(DI.SkillCategory.UpdateSkillItem)) {}

  public plugin() {
    return new Elysia().put(
      '/skill-items/:id',
      async ({ params, body, set }) => {
        const result = await this.updateSkillItem.execute({
          itemId: params.id,
          name: body.name,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          name: t.Optional(t.String({ minLength: 1 })),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
