import { inject, injectable } from '@needle-di/core';
import type { GetJobDescription } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetJobDescriptionRoute {
  public constructor(private readonly getJobDescription: GetJobDescription = inject(DI.JobDescription.Get)) {}

  public plugin() {
    return new Elysia().get(
      '/job-descriptions/:id',
      async ({ params, set }) => {
        try {
          const data = await this.getJobDescription.execute({ jobDescriptionId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('JobDescription not found')) {
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
