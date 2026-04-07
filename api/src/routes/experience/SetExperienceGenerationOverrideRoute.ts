import { inject, injectable } from '@needle-di/core';
import type { SetExperienceGenerationOverride } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SetExperienceGenerationOverrideRoute {
  public constructor(
    private readonly setOverride: SetExperienceGenerationOverride = inject(DI.ExperienceGenerationOverride.Set)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:id/generation-override',
      async ({ params, body }) => {
        const data = await this.setOverride.execute({
          experienceId: params.id,
          bulletMin: body.bullet_min,
          bulletMax: body.bullet_max
        });
        return { data };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          bullet_min: t.Integer({ minimum: 1, maximum: 20 }),
          bullet_max: t.Integer({ minimum: 1, maximum: 20 })
        })
      }
    );
  }
}
