import { inject, injectable } from '@needle-di/core';
import type { DeleteHeadline } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteHeadlineRoute {
  public constructor(private readonly deleteHeadline: DeleteHeadline = inject(DI.Resume.DeleteHeadline)) {}

  public plugin() {
    return new Elysia().delete(
      '/users/:userId/resume/headlines/:id',
      async ({ params, set }) => {
        const result = await this.deleteHeadline.execute({ headlineId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }

        set.status = 204;
        return;
      },
      {
        params: t.Object({
          userId: t.String({ format: 'uuid' }),
          id: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
