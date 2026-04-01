import { inject, injectable } from '@needle-di/core';
import type { DeleteExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteExperienceRoute {
  public constructor(private readonly deleteExperience: DeleteExperience = inject(DI.Experience.Delete)) {}

  public plugin() {
    return new Elysia().delete(
      '/experiences/:id',
      async ({ params, set }) => {
        const result = await this.deleteExperience.execute({ experienceId: params.id });
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
