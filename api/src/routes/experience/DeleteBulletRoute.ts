import { inject, injectable } from '@needle-di/core';
import type { DeleteBullet } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteBulletRoute {
  public constructor(private readonly deleteBullet: DeleteBullet = inject(DI.Experience.DeleteBullet)) {}

  public plugin() {
    return new Elysia().delete(
      '/bullets/:id',
      async ({ params, body, set }) => {
        const result = await this.deleteBullet.execute({
          experienceId: body.experience_id,
          bulletId: params.id
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          experience_id: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
