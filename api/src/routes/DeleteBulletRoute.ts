import { inject, injectable } from '@needle-di/core';
import type { DeleteBullet } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteBulletRoute {
  public constructor(private readonly deleteBullet: DeleteBullet = inject(DI.Resume.DeleteBullet)) {}

  public plugin() {
    return new Elysia().delete(
      '/resume/positions/:positionId/bullets/:bulletId',
      async ({ params, set }) => {
        const result = await this.deleteBullet.execute({
          positionId: params.positionId,
          bulletId: params.bulletId
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ positionId: t.String({ format: 'uuid' }), bulletId: t.String({ format: 'uuid' }) })
      }
    );
  }
}
