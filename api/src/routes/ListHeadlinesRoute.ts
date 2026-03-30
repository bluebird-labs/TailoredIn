import { inject, injectable } from '@needle-di/core';
import type { ListHeadlines } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ListHeadlinesRoute {
  public constructor(private readonly listHeadlines: ListHeadlines = inject(DI.Resume.ListHeadlines)) {}

  public plugin() {
    return new Elysia().get(
      '/users/:userId/resume/headlines',
      async ({ params }) => {
        const headlines = await this.listHeadlines.execute({ userId: params.userId });
        return { data: headlines };
      },
      {
        params: t.Object({ userId: t.String({ format: 'uuid' }) })
      }
    );
  }
}
