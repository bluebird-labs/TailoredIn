import { inject, injectable } from '@needle-di/core';
import type { RemoveExperienceGenerationOverride } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class RemoveExperienceGenerationOverrideRoute {
  public constructor(
    private readonly removeOverride: RemoveExperienceGenerationOverride = inject(DI.ExperienceGenerationOverride.Remove)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/experiences/:id/generation-override',
      async ({ params, set }) => {
        await this.removeOverride.execute({ experienceId: params.id });
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
