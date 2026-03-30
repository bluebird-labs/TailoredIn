import { inject, injectable } from '@needle-di/core';
import type { DeleteEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteEducationRoute {
  public constructor(private readonly deleteEducation: DeleteEducation = inject(DI.Resume.DeleteEducation)) {}

  public plugin() {
    return new Elysia().delete(
      '/users/:userId/resume/education/:id',
      async ({ params, set }) => {
        const result = await this.deleteEducation.execute({ educationId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }

        set.status = 204;
        return;
      },
      {
        params: t.Object({
          userId: t.String({ format: 'uuid' }),
          id: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
