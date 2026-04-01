import { inject, injectable } from '@needle-di/core';
import type { AddBullet } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class AddBulletRoute {
  public constructor(private readonly addBullet: AddBullet = inject(DI.Experience.AddBullet)) {}

  public plugin() {
    return new Elysia().post(
      '/experiences/:id/bullets',
      async ({ params, body, set }) => {
        const result = await this.addBullet.execute({
          experienceId: params.id,
          content: body.content,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 201;
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          content: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
