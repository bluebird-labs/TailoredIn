import { inject, injectable } from '@needle-di/core';
import type { SetArchetypeSkills } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SetArchetypeSkillsRoute {
  public constructor(private readonly setSkills: SetArchetypeSkills = inject(DI.Archetype.SetSkills)) {}

  public plugin() {
    return new Elysia().put(
      '/archetypes/:id/skills',
      async ({ params, body, set }) => {
        const result = await this.setSkills.execute({
          archetypeId: params.id,
          categorySelections: body.category_selections.map(s => ({
            categoryId: s.category_id,
            ordinal: s.ordinal
          })),
          itemSelections: body.item_selections.map(s => ({ itemId: s.item_id, ordinal: s.ordinal }))
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          category_selections: t.Array(
            t.Object({ category_id: t.String({ format: 'uuid' }), ordinal: t.Integer({ minimum: 0 }) })
          ),
          item_selections: t.Array(
            t.Object({ item_id: t.String({ format: 'uuid' }), ordinal: t.Integer({ minimum: 0 }) })
          )
        })
      }
    );
  }
}
