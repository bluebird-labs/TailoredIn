import { inject, injectable } from '@needle-di/core';
import type { ListApplications } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ListApplicationsRoute {
  public constructor(private readonly listApplications: ListApplications = inject(DI.Application.List)) {}

  public plugin() {
    return new Elysia().get(
      '/applications',
      async ({ query }) => {
        const data = await this.listApplications.execute({ profileId: query.profile_id });
        return { data };
      },
      {
        query: t.Object({
          profile_id: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
