import { inject, injectable } from '@needle-di/core';
import type { ListArchetypes } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListArchetypesRoute {
  public constructor(private readonly listArchetypes: ListArchetypes = inject(DI.Archetype.List)) {}

  public plugin() {
    return new Elysia().get('/archetypes', async () => {
      const data = await this.listArchetypes.execute();
      return { data };
    });
  }
}
