import { inject, injectable } from '@needle-di/core';
import type { DeleteArchetype2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteArchetype2Route {
  public constructor(private readonly deleteArchetype: DeleteArchetype2 = inject(DI.Archetype2.Delete)) {}

  public plugin() {
    return new Elysia().delete(
      '/archetypes/:id',
      async ({ params, set }) => {
        const result = await this.deleteArchetype.execute({ archetypeId: params.id });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return;
      },
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    );
  }
}
