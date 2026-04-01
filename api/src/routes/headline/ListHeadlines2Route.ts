import { inject, injectable } from '@needle-di/core';
import type { ListHeadlines2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListHeadlines2Route {
  public constructor(private readonly listHeadlines: ListHeadlines2 = inject(DI.Headline.List)) {}

  public plugin() {
    return new Elysia().get('/headlines', async () => {
      const headlines = await this.listHeadlines.execute();
      return { data: headlines };
    });
  }
}
