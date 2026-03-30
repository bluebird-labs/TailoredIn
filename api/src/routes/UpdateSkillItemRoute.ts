import { inject, injectable } from '@needle-di/core';
import type { UpdateSkillItem } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateSkillItemRoute {
  public constructor(private readonly updateSkillItem: UpdateSkillItem = inject(DI.Resume.UpdateSkillItem)) {}

  public plugin() {
    return new Elysia().put(
      '/resume/skills/:id/items/:itemId',
      async ({ params, body, set }) => {
        const result = await this.updateSkillItem.execute({
          categoryId: params.id,
          itemId: params.itemId,
          skillName: body.skill_name,
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
        params: t.Object({ id: t.String({ format: 'uuid' }), itemId: t.String({ format: 'uuid' }) }),
        body: t.Object({
          skill_name: t.Optional(t.String({ minLength: 1 })),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
