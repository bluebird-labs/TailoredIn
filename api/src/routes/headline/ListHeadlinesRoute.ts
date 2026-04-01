import { inject, injectable } from '@needle-di/core';
import type { ListHeadlines } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListHeadlinesRoute {
  public constructor(private readonly listHeadlines: ListHeadlines = inject(DI.Headline.List)) {}

  public plugin() {
    return new Elysia().get('/headlines', async () => {
      const headlines = await this.listHeadlines.execute();
      return { data: headlines };
    });
  }
}
