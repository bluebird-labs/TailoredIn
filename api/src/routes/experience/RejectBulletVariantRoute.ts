import { inject, injectable } from '@needle-di/core';
import type { ApproveBulletVariant } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class RejectBulletVariantRoute {
  public constructor(
    private readonly approveBulletVariant: ApproveBulletVariant = inject(DI.Experience.ApproveVariant)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/variants/:id/reject',
      async ({ params, body, set }) => {
        const result = await this.approveBulletVariant.execute({
          experienceId: body.experience_id,
          bulletId: body.bullet_id,
          variantId: params.id,
          action: 'reject'
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
          bullet_id: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
