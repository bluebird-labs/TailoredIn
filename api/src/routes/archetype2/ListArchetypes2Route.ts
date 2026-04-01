import { inject, injectable } from '@needle-di/core';
import type { ListArchetypes2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListArchetypes2Route {
  public constructor(private readonly listArchetypes: ListArchetypes2 = inject(DI.Archetype2.List)) {}

  public plugin() {
    return new Elysia().get('/archetypes', async () => {
      const data = await this.listArchetypes.execute();
      return { data };
    });
  }
}
