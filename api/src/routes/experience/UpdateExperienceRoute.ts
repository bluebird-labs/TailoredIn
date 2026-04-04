import { inject, injectable } from '@needle-di/core';
import type { UpdateExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateExperienceRoute {
  public constructor(private readonly updateExperience: UpdateExperience = inject(DI.Experience.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:id',
      async ({ params, body, set }) => {
        const result = await this.updateExperience.execute({
          experienceId: params.id,
          title: body.title,
          companyName: body.company_name,
          companyWebsite: body.company_website ?? null,
          location: body.location,
          startDate: body.start_date,
          endDate: body.end_date,
          summary: body.summary ?? null,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          title: t.String({ minLength: 1 }),
          company_name: t.String({ minLength: 1 }),
          company_website: t.Optional(t.String()),
          location: t.String({ minLength: 1 }),
          start_date: t.String({ minLength: 1 }),
          end_date: t.String({ minLength: 1 }),
          summary: t.Optional(t.String()),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
