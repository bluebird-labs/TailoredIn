import { inject, injectable } from '@needle-di/core';
import type { BulkChangeJobStatus } from '@tailoredin/application';
import { JobStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class BulkChangeJobStatusRoute {
  public constructor(private readonly bulkChangeJobStatus: BulkChangeJobStatus = inject(DI.Job.BulkChangeJobStatus)) {}

  public plugin() {
    return new Elysia().put(
      '/jobs/bulk-status',
      async ({ body }) => {
        const result = await this.bulkChangeJobStatus.execute({
          jobIds: body.job_ids,
          newStatus: body.status
        });

        if (!result.isOk) {
          return { error: result.error.message };
        }

        return { data: result.value };
      },
      {
        body: t.Object({
          job_ids: t.Array(t.String({ format: 'uuid' })),
          status: t.Enum(JobStatus)
        })
      }
    );
  }
}
