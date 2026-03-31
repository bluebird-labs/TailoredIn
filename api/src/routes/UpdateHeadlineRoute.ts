import { inject, injectable } from '@needle-di/core';
import type { UpdateHeadline } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateHeadlineRoute {
  public constructor(private readonly updateHeadline: UpdateHeadline = inject(DI.Resume.UpdateHeadline)) {}

  public plugin() {
    return new Elysia().put(
      '/users/:userId/resume/headlines/:id',
      async ({ params, body, set }) => {
        const result = await this.updateHeadline.execute({
          headlineId: params.id,
          headlineLabel: body.headline_label,
          summaryText: body.summary_text
        });

        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        return { data: result.value };
      },
      {
        params: t.Object({
          userId: t.String({ format: 'uuid' }),
          id: t.String({ format: 'uuid' })
        }),
        body: t.Object({
          headline_label: t.String({ minLength: 1 }),
          summary_text: t.String({ minLength: 1 })
        })
      }
    );
  }
}
