import { inject, injectable } from '@needle-di/core';
import type { DeleteApplication } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteApplicationRoute {
  public constructor(private readonly deleteApplication: DeleteApplication = inject(DI.Application.Delete)) {}

  public plugin() {
    return new Elysia().delete(
      '/applications/:id',
      async ({ params, set }) => {
        const result = await this.deleteApplication.execute({ applicationId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
