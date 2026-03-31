import { inject, injectable } from '@needle-di/core';
import type { UpdatePosition } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdatePositionRoute {
  public constructor(private readonly updatePosition: UpdatePosition = inject(DI.Resume.UpdatePosition)) {}

  public plugin() {
    return new Elysia().put(
      '/resume/companies/:id/positions/:positionId',
      async ({ params, body, set }) => {
        const result = await this.updatePosition.execute({
          companyId: params.id,
          positionId: params.positionId,
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
        set.status = 204;
        return;
      },
      {
        params: t.Object({
          id: t.String({ format: 'uuid' }),
          positionId: t.String({ format: 'uuid' })
        }),
        body: t.Object({
          title: t.Optional(t.String({ minLength: 1 })),
          start_date: t.Optional(t.String({ minLength: 1 })),
          end_date: t.Optional(t.String({ minLength: 1 })),
          summary: t.Optional(t.Nullable(t.String())),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
