import { inject, injectable } from '@needle-di/core';
import type { UpdateEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateEducationRoute {
  public constructor(private readonly updateEducation: UpdateEducation = inject(DI.Resume.UpdateEducation)) {}

  public plugin() {
    return new Elysia().put(
      '/users/:userId/resume/education/:id',
      async ({ params, body, set }) => {
        const result = await this.updateEducation.execute({
          educationId: params.id,
          degreeTitle: body.degree_title,
          institutionName: body.institution_name,
          graduationYear: body.graduation_year,
          locationLabel: body.location_label,
          ordinal: body.ordinal
        });

        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }

        return { data: result.value };
      },
      {
        params: t.Object({
          userId: t.String({ format: 'uuid' }),
          id: t.String({ format: 'uuid' })
        }),
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
