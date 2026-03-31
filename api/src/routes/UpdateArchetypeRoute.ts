import { inject, injectable } from '@needle-di/core';
import type { UpdateArchetype } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateArchetypeRoute {
  public constructor(private readonly updateArchetype: UpdateArchetype = inject(DI.Archetype.UpdateArchetype)) {}

  public plugin() {
    return new Elysia().put(
      '/archetypes/:id',
      async ({ params, body, set }) => {
        const result = await this.updateArchetype.execute({
          archetypeId: params.id,
          archetypeLabel: body.archetype_label,
          archetypeDescription: body.archetype_description,
          headlineId: body.headline_id,
          socialNetworks: body.social_networks
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
          archetype_label: t.Optional(t.String({ minLength: 1 })),
          archetype_description: t.Optional(t.Nullable(t.String())),
          headline_id: t.Optional(t.String({ format: 'uuid' })),
          social_networks: t.Optional(t.Array(t.String()))
        })
      }
    );
  }
}
