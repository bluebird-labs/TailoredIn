import { inject, injectable } from '@needle-di/core';
import type { ListJobDescriptions } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ListJobDescriptionsRoute {
  public constructor(private readonly listJobDescriptions: ListJobDescriptions = inject(DI.JobDescription.List)) {}

  public plugin() {
    return new Elysia().get(
      '/job-descriptions',
      async ({ query }) => {
        const data = await this.listJobDescriptions.execute({ companyId: query.company_id });
        return { data };
      },
      {
        query: t.Object({
          company_id: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
