import { inject, injectable } from '@needle-di/core';
import type { CreateEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import type { AuthContext } from '../../middleware/auth.js';

@injectable()
export class CreateEducationRoute {
  public constructor(private readonly createEducation: CreateEducation = inject(DI.Education.CreateEducation)) {}

  public plugin() {
    return new Elysia().post(
      '/educations',
      async ctx => {
        const { auth } = ctx as unknown as AuthContext;
        const { body, set } = ctx;
        const entry = await this.createEducation.execute({
          profileId: auth.profileId,
          degreeTitle: body.degree_title,
          institutionName: body.institution_name,
          graduationYear: body.graduation_year,
          location: body.location,
          honors: body.honors,
          ordinal: body.ordinal,
          hiddenByDefault: body.hidden_by_default
        });

        set.status = 201;
        return { data: entry };
      },
      {
        body: t.Object({
          degree_title: t.String({ minLength: 1 }),
          institution_name: t.String({ minLength: 1 }),
          graduation_year: t.Integer({ minimum: 1900, maximum: 2100 }),
          location: t.Union([t.String({ minLength: 1 }), t.Null()]),
          honors: t.Union([t.String({ minLength: 1 }), t.Null()]),
          ordinal: t.Integer({ minimum: 0 }),
          hidden_by_default: t.Optional(t.Boolean({ default: false }))
        })
      }
    );
  }
}
