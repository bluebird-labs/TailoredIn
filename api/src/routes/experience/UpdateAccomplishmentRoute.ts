import { inject, injectable } from '@needle-di/core';
import type { UpdateAccomplishment } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateAccomplishmentRoute {
  public constructor(
    private readonly updateAccomplishment: UpdateAccomplishment = inject(DI.Experience.UpdateAccomplishment)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:id/accomplishments/:accomplishmentId',
      async ({ params, body, set }) => {
        const result = await this.updateAccomplishment.execute({
          experienceId: params.id,
          accomplishmentId: params.accomplishmentId,
          title: body.title,
          narrative: body.narrative,
          skillTags: body.skill_tags,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return { data: null };
      },
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
          accomplishmentId: t.String({ format: 'uuid' })
        }),
        body: t.Object({
          title: t.Optional(t.String({ minLength: 1 })),
          narrative: t.Optional(t.String({ minLength: 1 })),
          skill_tags: t.Optional(t.Array(t.String())),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
