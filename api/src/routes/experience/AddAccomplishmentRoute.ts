import { inject, injectable } from '@needle-di/core';
import type { AddAccomplishment } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class AddAccomplishmentRoute {
  public constructor(private readonly addAccomplishment: AddAccomplishment = inject(DI.Experience.AddAccomplishment)) {}

  public plugin() {
    return new Elysia().post(
      '/experiences/:id/accomplishments',
      async ({ params, body, set }) => {
        const result = await this.addAccomplishment.execute({
          experienceId: params.id,
          title: body.title,
          narrative: body.narrative,
          skillTags: body.skill_tags,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 201;
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          title: t.String({ minLength: 1 }),
          narrative: t.String({ minLength: 1 }),
          skill_tags: t.Array(t.String()),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
