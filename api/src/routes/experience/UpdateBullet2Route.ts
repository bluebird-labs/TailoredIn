import { inject, injectable } from '@needle-di/core';
import type { UpdateBullet2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateBullet2Route {
  public constructor(private readonly updateBullet: UpdateBullet2 = inject(DI.Experience.UpdateBullet)) {}

  public plugin() {
    return new Elysia().put(
      '/bullets/:id',
      async ({ params, body, set }) => {
        const result = await this.updateBullet.execute({
          experienceId: body.experience_id,
          bulletId: params.id,
          content: body.content,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          experience_id: t.String({ format: 'uuid' }),
          content: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
