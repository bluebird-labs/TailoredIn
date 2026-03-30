import { inject, injectable } from '@needle-di/core';
import type { GetJob } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetJobRoute {
  public constructor(private readonly getJob: GetJob = inject(DI.Job.GetJob)) {}

  public plugin() {
    return new Elysia().get(
      '/jobs/:id',
      async ({ params, query }) => {
        const job = await this.getJob.execute({
          jobId: params.id,
          targetSalary: query.target_salary
        });

        return { data: job };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        query: t.Object({
          target_salary: t.Numeric({ minimum: 100000 })
        })
      }
    );
  }
}
