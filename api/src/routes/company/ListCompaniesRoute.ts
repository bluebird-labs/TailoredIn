import { inject, injectable } from '@needle-di/core';
import type { ListCompanies } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListCompaniesRoute {
  public constructor(private readonly listCompanies: ListCompanies = inject(DI.Company.List)) {}

  public plugin() {
    return new Elysia().get('/companies', async () => {
      const companies = await this.listCompanies.execute();
      return { data: companies };
    });
  }
}
