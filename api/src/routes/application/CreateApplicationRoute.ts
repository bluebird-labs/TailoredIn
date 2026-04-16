import { inject, injectable } from '@needle-di/core';
import type { CreateApplication } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import type { AuthContext } from '../../middleware/auth.js';

@injectable()
export class CreateApplicationRoute {
  public constructor(private readonly createApplication: CreateApplication = inject(DI.Application.Create)) {}

  public plugin() {
    return new Elysia().post(
      '/applications',
      async ctx => {
        const { auth } = ctx as unknown as AuthContext;
        const { body, set } = ctx;
        const data = await this.createApplication.execute({
          profileId: auth.profileId,
          companyId: body.company_id,
          jobDescriptionId: body.job_description_id,
          notes: body.notes
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          company_id: t.String({ format: 'uuid' }),
          job_description_id: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
          notes: t.Optional(t.Nullable(t.String()))
        })
      }
    );
  }
}
