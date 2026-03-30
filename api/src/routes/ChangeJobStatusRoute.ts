import { inject, injectable } from '@needle-di/core';
import type { ChangeJobStatus } from '@tailoredin/application';
import { JobStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ChangeJobStatusRoute {
  constructor(private readonly changeJobStatus: ChangeJobStatus = inject(DI.Job.ChangeJobStatus)) {}

  plugin() {
    return new Elysia().put(
      '/jobs/:id/status',
      async ({ params, body, set }) => {
        const result = await this.changeJobStatus.execute({
          jobId: params.id,
          newStatus: body.status
        });

        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }

        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({ status: t.Enum(JobStatus) })
      }
    );
  }
}
