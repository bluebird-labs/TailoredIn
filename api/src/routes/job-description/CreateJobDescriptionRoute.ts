import { inject, injectable } from '@needle-di/core';
import type { CreateJobDescription } from '@tailoredin/application';
import type { JobLevel, JobSource, LocationType } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateJobDescriptionRoute {
  public constructor(private readonly createJobDescription: CreateJobDescription = inject(DI.JobDescription.Create)) {}

  public plugin() {
    return new Elysia().post(
      '/job-descriptions',
      async ({ body, set }) => {
        const data = await this.createJobDescription.execute({
          companyId: body.company_id,
          title: body.title,
          description: body.description,
          url: body.url,
          location: body.location,
          salaryMin: body.salary_min,
          salaryMax: body.salary_max,
          salaryCurrency: body.salary_currency,
          level: body.level as JobLevel | undefined,
          locationType: body.location_type as LocationType | undefined,
          source: body.source as JobSource,
          postedAt: body.posted_at ? new Date(body.posted_at) : null,
          rawText: body.raw_text
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          company_id: t.String({ format: 'uuid' }),
          title: t.String({ minLength: 1 }),
          description: t.String({ minLength: 1 }),
          url: t.Optional(t.Nullable(t.String())),
          location: t.Optional(t.Nullable(t.String())),
          salary_min: t.Optional(t.Nullable(t.Number())),
          salary_max: t.Optional(t.Nullable(t.Number())),
          salary_currency: t.Optional(t.Nullable(t.String())),
          level: t.Optional(t.Nullable(t.String())),
          location_type: t.Optional(t.Nullable(t.String())),
          source: t.String({ minLength: 1 }),
          posted_at: t.Optional(t.Nullable(t.String())),
          raw_text: t.Optional(t.Nullable(t.String()))
        })
      }
    );
  }
}
