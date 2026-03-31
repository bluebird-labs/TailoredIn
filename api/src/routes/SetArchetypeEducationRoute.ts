import { inject, injectable } from '@needle-di/core';
import type { SetArchetypeEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SetArchetypeEducationRoute {
  public constructor(private readonly setEducation: SetArchetypeEducation = inject(DI.Archetype.SetEducation)) {}

  public plugin() {
    return new Elysia().put(
      '/archetypes/:id/education',
      async ({ params, body, set }) => {
        const result = await this.setEducation.execute({
          archetypeId: params.id,
          selections: body.selections.map(s => ({ educationId: s.education_id, ordinal: s.ordinal }))
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
          selections: t.Array(
            t.Object({ education_id: t.String({ format: 'uuid' }), ordinal: t.Integer({ minimum: 0 }) })
          )
        })
      }
    );
  }
}
