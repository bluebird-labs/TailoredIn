import { inject, injectable } from '@needle-di/core';
import type { GetCompany } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetCompanyRoute {
  public constructor(private readonly getCompany: GetCompany = inject(DI.Company.Get)) {}

  public plugin() {
    return new Elysia().get(
      '/companies/:id',
      async ({ params, set }) => {
        try {
          const data = await this.getCompany.execute({ companyId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('Company not found')) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
