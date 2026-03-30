import { inject, injectable } from '@needle-di/core';
import type { ListJobs } from '@tailoredin/application';
import { JobStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ListJobsRoute {
  public constructor(private readonly listJobs: ListJobs = inject(DI.Job.ListJobs)) {}

  public plugin() {
    return new Elysia().get(
      '/jobs',
      async ({ query }) => {
        const result = await this.listJobs.execute({
          page: query.page,
          pageSize: query.page_size,
          targetSalary: query.target_salary,
          statuses: query.status as JobStatus[] | undefined,
          sortBy: query.sort_by,
          sortDir: query.sort_dir
        });

        return { data: result };
      },
      {
        query: t.Object({
          page: t.Numeric({ minimum: 1, default: 1 }),
          page_size: t.Numeric({ minimum: 1, maximum: 100, default: 25 }),
          target_salary: t.Numeric({ minimum: 100000 }),
          status: t.Optional(t.Union([t.Array(t.Enum(JobStatus)), t.Enum(JobStatus)])),
          sort_by: t.Optional(t.Union([t.Literal('score'), t.Literal('posted_at')])),
          sort_dir: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')]))
        })
      }
    );
  }
}
