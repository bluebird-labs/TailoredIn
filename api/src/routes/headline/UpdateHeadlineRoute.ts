import { inject, injectable } from '@needle-di/core';
import type { UpdateHeadline } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateHeadlineRoute {
  public constructor(private readonly updateHeadline: UpdateHeadline = inject(DI.Headline.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/headlines/:id',
      async ({ params, body, set }) => {
        const result = await this.updateHeadline.execute({
          headlineId: params.id,
          label: body.label,
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
          id: t.String({ format: 'uuid' })
        }),
        body: t.Object({
          label: t.String({ minLength: 1 }),
          summary_text: t.String({ minLength: 1 })
        })
      }
    );
  }
}
