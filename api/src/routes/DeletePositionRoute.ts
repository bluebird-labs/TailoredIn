import { inject, injectable } from '@needle-di/core';
import type { DeletePosition } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeletePositionRoute {
  public constructor(private readonly deletePosition: DeletePosition = inject(DI.Resume.DeletePosition)) {}

  public plugin() {
    return new Elysia().delete(
      '/resume/companies/:id/positions/:positionId',
      async ({ params, set }) => {
        const result = await this.deletePosition.execute({
          companyId: params.id,
          positionId: params.positionId
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
        })
      }
    );
  }
}
