import { inject, injectable } from '@needle-di/core';
import type { DeleteAccomplishment } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteAccomplishmentRoute {
  public constructor(
    private readonly deleteAccomplishment: DeleteAccomplishment = inject(DI.Experience.DeleteAccomplishment)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/experiences/:experienceId/accomplishments/:accomplishmentId',
      async ({ params, set }) => {
        const result = await this.deleteAccomplishment.execute({
          experienceId: params.experienceId,
          accomplishmentId: params.accomplishmentId
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({
          experienceId: t.String({ format: 'uuid' }),
          accomplishmentId: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
