import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { CreateExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

@injectable()
export class CreateExperienceRoute {
  public constructor(
    private readonly createExperience: CreateExperience = inject(DI.Experience.Create),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/experiences',
      async ({ body, set }) => {
        const profileId = await getProfileId(this.orm);
        const data = await this.createExperience.execute({
          profileId,
          title: body.title,
          companyName: body.company_name,
          companyWebsite: body.company_website ?? null,
          companyAccent: body.company_accent ?? null,
          location: body.location,
          startDate: body.start_date,
          endDate: body.end_date,
          summary: body.summary ?? null,
          ordinal: body.ordinal
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          title: t.String({ minLength: 1 }),
          company_name: t.String({ minLength: 1 }),
          company_website: t.Optional(t.String()),
          company_accent: t.Optional(t.String()),
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
