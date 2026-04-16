import { inject, injectable } from '@needle-di/core';
import type { ListConcepts } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListConceptsRoute {
  public constructor(private readonly listConcepts: ListConcepts = inject(DI.Skill.ListConcepts)) {}

  public plugin() {
    return new Elysia().get('/concepts', async () => {
      const data = await this.listConcepts.execute();
      return { data };
    });
  }
}
