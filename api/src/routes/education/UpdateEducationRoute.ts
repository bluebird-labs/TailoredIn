import { inject, injectable } from '@needle-di/core';
import type { UpdateEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateEducationRoute {
  public constructor(private readonly updateEducation: UpdateEducation = inject(DI.Education.UpdateEducation)) {}

  public plugin() {
    return new Elysia().put(
      '/educations/:id',
      async ({ params, body, set }) => {
        const result = await this.updateEducation.execute({
          educationId: params.id,
          degreeTitle: body.degree_title,
          institutionName: body.institution_name,
          graduationYear: body.graduation_year,
          location: body.location,
          honors: body.honors,
          ordinal: body.ordinal,
          hiddenByDefault: body.hidden_by_default
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
          degree_title: t.String({ minLength: 1 }),
          institution_name: t.String({ minLength: 1 }),
          graduation_year: t.Integer({ minimum: 1900, maximum: 2100 }),
          location: t.Union([t.String({ minLength: 1 }), t.Null()]),
          honors: t.Union([t.String({ minLength: 1 }), t.Null()]),
          ordinal: t.Integer({ minimum: 0 }),
          hidden_by_default: t.Boolean()
        })
      }
    );
  }
}
