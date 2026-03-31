import { inject, injectable } from '@needle-di/core';
import type { CreatePosition } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreatePositionRoute {
  public constructor(private readonly createPosition: CreatePosition = inject(DI.Resume.CreatePosition)) {}

  public plugin() {
    return new Elysia().post(
      '/resume/companies/:id/positions',
      async ({ params, body, set }) => {
        const result = await this.createPosition.execute({
          companyId: params.id,
          title: body.title,
          startDate: body.start_date,
          endDate: body.end_date,
          summary: body.summary,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }
        set.status = 201;
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          title: t.String({ minLength: 1 }),
          start_date: t.String({ minLength: 1 }),
          end_date: t.String({ minLength: 1 }),
          summary: t.Nullable(t.String()),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
