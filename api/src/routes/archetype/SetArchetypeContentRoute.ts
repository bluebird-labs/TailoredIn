import { inject, injectable } from '@needle-di/core';
import type { SetArchetypeContent } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SetArchetypeContentRoute {
  public constructor(private readonly setContent: SetArchetypeContent = inject(DI.Archetype.SetContent)) {}

  public plugin() {
    return new Elysia().put(
      '/archetypes/:id/content',
      async ({ params, body, set }) => {
        const result = await this.setContent.execute({
          archetypeId: params.id,
          contentSelection: {
            experienceSelections: body.experience_selections.map(es => ({
              experienceId: es.experience_id,
              bulletIds: es.bullet_ids
            })),
            projectIds: body.project_ids ?? [],
            educationIds: body.education_ids,
            skillCategoryIds: body.skill_category_ids,
            skillItemIds: body.skill_item_ids
          }
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
          experience_selections: t.Array(
            t.Object({
              experience_id: t.String({ format: 'uuid' }),
              bullet_ids: t.Array(t.String({ format: 'uuid' }))
            })
          ),
          project_ids: t.Optional(t.Array(t.String({ format: 'uuid' }))),
          education_ids: t.Array(t.String({ format: 'uuid' })),
          skill_category_ids: t.Array(t.String({ format: 'uuid' })),
          skill_item_ids: t.Array(t.String({ format: 'uuid' }))
        })
      }
    );
  }
}
