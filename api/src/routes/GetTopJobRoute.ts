import { inject, injectable } from '@needle-di/core';
import type { GetTopJob } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetTopJobRoute {
  constructor(private readonly getTopJob: GetTopJob = inject(DI.Job.GetTopJob)) {}

  plugin() {
    return new Elysia().get(
      '/jobs/tops/next',
      async ({ query }) => {
        const job = await this.getTopJob.execute({
          targetSalary: query.target_salary,
          hoursPostedMax: query.hours_posted_max
        });

        return { data: job };
      },
      {
        query: t.Object({
          target_salary: t.Numeric({ minimum: 100000 }),
          hours_posted_max: t.Optional(t.Numeric({ minimum: 1, default: 48 }))
        })
      }
    );
  }
}
