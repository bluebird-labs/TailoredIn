import { inject, injectable } from '@needle-di/core';
import type { GetApplication } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetApplicationRoute {
  public constructor(private readonly getApplication: GetApplication = inject(DI.Application.Get)) {}

  public plugin() {
    return new Elysia().get(
      '/applications/:id',
      async ({ params, set }) => {
        try {
          const data = await this.getApplication.execute({ applicationId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('Application not found')) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
