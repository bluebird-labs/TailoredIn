import { inject, injectable } from '@needle-di/core';
import type { DeleteBulletVariant } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteBulletVariantRoute {
  public constructor(private readonly deleteVariant: DeleteBulletVariant = inject(DI.Experience.DeleteVariant)) {}

  public plugin() {
    return new Elysia().delete(
      '/variants/:id',
      async ({ params, body, set }) => {
        const result = await this.deleteVariant.execute({
          experienceId: body.experience_id,
          bulletId: body.bullet_id,
          variantId: params.id
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
          experience_id: t.String({ format: 'uuid' }),
          bullet_id: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
