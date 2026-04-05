import { inject, injectable } from '@needle-di/core';
import type { UpdateApplication } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateApplicationRoute {
  public constructor(private readonly updateApplication: UpdateApplication = inject(DI.Application.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/applications/:id',
      async ({ params, body, set }) => {
        try {
          const data = await this.updateApplication.execute({
            applicationId: params.id,
            jobDescriptionId: body.job_description_id,
            notes: body.notes
          });
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
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          job_description_id: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
          notes: t.Optional(t.Nullable(t.String()))
        })
      }
    );
  }
}
