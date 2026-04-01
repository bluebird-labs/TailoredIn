import { inject, injectable } from '@needle-di/core';
import type { DeleteEducation2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteEducationRoute2 {
  public constructor(private readonly deleteEducation: DeleteEducation2 = inject(DI.Education.DeleteEducation)) {}

  public plugin() {
    return new Elysia().delete(
      '/educations/:id',
      async ({ params, set }) => {
        const result = await this.deleteEducation.execute({ educationId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
