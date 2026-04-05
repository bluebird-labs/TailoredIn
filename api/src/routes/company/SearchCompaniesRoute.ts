import { inject, injectable } from '@needle-di/core';
import type { SearchCompanies } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SearchCompaniesRoute {
  public constructor(private readonly searchCompanies: SearchCompanies = inject(DI.Company.Search)) {}

  public plugin() {
    return new Elysia().post(
      '/companies/search',
      async ({ body }) => {
        const data = await this.searchCompanies.execute({ name: body.name });
        return { data };
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 })
        })
      }
    );
  }
}
