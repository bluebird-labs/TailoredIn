import { inject, injectable } from '@needle-di/core';
import type { UpdateBullet } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateBulletRoute {
  public constructor(private readonly updateBullet: UpdateBullet = inject(DI.Resume.UpdateBullet)) {}

  public plugin() {
    return new Elysia().put(
      '/resume/positions/:positionId/bullets/:bulletId',
      async ({ params, body, set }) => {
        const result = await this.updateBullet.execute({
          positionId: params.positionId,
          bulletId: params.bulletId,
          content: body.content,
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
        params: t.Object({ positionId: t.String({ format: 'uuid' }), bulletId: t.String({ format: 'uuid' }) }),
        body: t.Object({
          content: t.Optional(t.String({ minLength: 1 })),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
