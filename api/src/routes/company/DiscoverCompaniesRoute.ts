import { inject, injectable } from '@needle-di/core';
import type { DiscoverCompanies } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DiscoverCompaniesRoute {
  public constructor(private readonly discoverCompanies: DiscoverCompanies = inject(DI.Company.Discover)) {}

  public plugin() {
    return new Elysia().post(
      '/companies/discover',
      async ({ body }) => {
        const data = await this.discoverCompanies.execute({ query: body.query });
        return { data };
      },
      {
        body: t.Object({
          query: t.String({ minLength: 1 })
        })
      }
    );
  }
}
