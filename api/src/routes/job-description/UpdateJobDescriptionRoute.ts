import { inject, injectable } from '@needle-di/core';
import type { UpdateJobDescription } from '@tailoredin/application';
import type { JobLevel, JobSource, LocationType } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateJobDescriptionRoute {
  public constructor(private readonly updateJobDescription: UpdateJobDescription = inject(DI.JobDescription.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/job-descriptions/:id',
      async ({ params, body, set }) => {
        try {
          const data = await this.updateJobDescription.execute({
            jobDescriptionId: params.id,
            title: body.title,
            description: body.description,
            url: body.url,
            location: body.location,
            salaryMin: body.salary_min,
            salaryMax: body.salary_max,
            salaryCurrency: body.salary_currency,
            level: body.level ? (body.level as JobLevel) : undefined,
            locationType: body.location_type ? (body.location_type as LocationType) : undefined,
            source: body.source as JobSource,
            postedAt: body.posted_at ? new Date(body.posted_at) : null,
            rawText: body.raw_text,
            soughtHardSkills: body.sought_hard_skills,
            soughtSoftSkills: body.sought_soft_skills
          });
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
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
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
          raw_text: t.Optional(t.Nullable(t.String())),
          sought_hard_skills: t.Optional(t.Nullable(t.Array(t.String()))),
          sought_soft_skills: t.Optional(t.Nullable(t.Array(t.String())))
        })
      }
    );
  }
}
