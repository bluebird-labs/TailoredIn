import { inject, injectable } from '@needle-di/core';
import type { UpdateArchetype } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateArchetypeRoute {
  public constructor(private readonly updateArchetype: UpdateArchetype = inject(DI.Archetype.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/archetypes/:id',
      async ({ params, body, set }) => {
        const result = await this.updateArchetype.execute({
          archetypeId: params.id,
          key: body.key,
          label: body.label,
          headlineId: body.headline_id ?? null,
          headlineText: body.headline_text ?? ''
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
          key: t.String({ minLength: 1 }),
          label: t.String({ minLength: 1 }),
          headline_id: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
          headline_text: t.Optional(t.String())
        })
      }
    );
  }
}
