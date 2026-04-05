import { inject, injectable } from '@needle-di/core';
import type { DeleteJobDescription } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteJobDescriptionRoute {
  public constructor(private readonly deleteJobDescription: DeleteJobDescription = inject(DI.JobDescription.Delete)) {}

  public plugin() {
    return new Elysia().delete(
      '/job-descriptions/:id',
      async ({ params, set }) => {
        const result = await this.deleteJobDescription.execute({ jobDescriptionId: params.id });

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
