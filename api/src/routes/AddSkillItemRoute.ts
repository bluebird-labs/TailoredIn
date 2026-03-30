import { inject, injectable } from '@needle-di/core';
import type { AddSkillItem } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class AddSkillItemRoute {
  public constructor(private readonly addSkillItem: AddSkillItem = inject(DI.Resume.AddSkillItem)) {}

  public plugin() {
    return new Elysia().post(
      '/resume/skills/:id/items',
      async ({ params, body, set }) => {
        const result = await this.addSkillItem.execute({
          categoryId: params.id,
          skillName: body.skill_name,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }
        set.status = 201;
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          skill_name: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
