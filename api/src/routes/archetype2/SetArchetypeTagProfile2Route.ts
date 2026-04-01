import { inject, injectable } from '@needle-di/core';
import type { SetArchetypeTagProfile2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SetArchetypeTagProfile2Route {
  public constructor(private readonly setTagProfile: SetArchetypeTagProfile2 = inject(DI.Archetype2.SetTagProfile)) {}

  public plugin() {
    return new Elysia().put(
      '/archetypes/:id/tag-profile',
      async ({ params, body, set }) => {
        const result = await this.setTagProfile.execute({
          archetypeId: params.id,
          roleWeights: body.role_weights,
          skillWeights: body.skill_weights
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          role_weights: t.Record(t.String(), t.Number({ minimum: 0, maximum: 1 })),
          skill_weights: t.Record(t.String(), t.Number({ minimum: 0, maximum: 1 }))
        })
      }
    );
  }
}
