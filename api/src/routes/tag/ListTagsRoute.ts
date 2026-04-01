import { inject, injectable } from '@needle-di/core';
import type { ListTags } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ListTagsRoute {
  public constructor(private readonly listTags: ListTags = inject(DI.Tag.List)) {}

  public plugin() {
    return new Elysia().get(
      '/tags',
      async ({ query }) => {
        const tags = await this.listTags.execute({ dimension: query.dimension });
        return { data: tags };
      },
      {
        query: t.Object({
          dimension: t.Optional(t.String())
        })
      }
    );
  }
}
