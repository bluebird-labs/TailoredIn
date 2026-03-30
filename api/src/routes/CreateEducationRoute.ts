import { inject, injectable } from '@needle-di/core';
import type { CreateEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateEducationRoute {
  public constructor(private readonly createEducation: CreateEducation = inject(DI.Resume.CreateEducation)) {}

  public plugin() {
    return new Elysia().post(
      '/users/:userId/resume/education',
      async ({ params, body, set }) => {
        const entry = await this.createEducation.execute({
          userId: params.userId,
          degreeTitle: body.degree_title,
          institutionName: body.institution_name,
          graduationYear: body.graduation_year,
          locationLabel: body.location_label,
          ordinal: body.ordinal
        });

        set.status = 201;
        return { data: entry };
      },
      {
        params: t.Object({ userId: t.String({ format: 'uuid' }) }),
        body: t.Object({
          degree_title: t.String({ minLength: 1 }),
          institution_name: t.String({ minLength: 1 }),
          graduation_year: t.String({ minLength: 4, maxLength: 4 }),
          location_label: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
