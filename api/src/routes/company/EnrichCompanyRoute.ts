import { inject, injectable } from '@needle-di/core';
import type { EnrichCompanyData } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class EnrichCompanyRoute {
  public constructor(private readonly enrichCompanyData: EnrichCompanyData = inject(DI.Company.Enrich)) {}

  public plugin() {
    return new Elysia().post(
      '/companies/enrich',
      async ({ body }) => {
        const data = await this.enrichCompanyData.execute({ url: body.url });
        return { data };
      },
      {
        body: t.Object({
          url: t.String({ minLength: 1 })
        })
      }
    );
  }
}
