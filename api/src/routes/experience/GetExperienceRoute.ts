import { inject, injectable } from '@needle-di/core';
import type { GetExperience } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetExperienceRoute {
  public constructor(private readonly getExperience: GetExperience = inject(DI.Experience.Get)) {}

  public plugin() {
    return new Elysia().get(
      '/experiences/:id',
      async ({ params, set }) => {
        try {
          const data = await this.getExperience.execute({ experienceId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
