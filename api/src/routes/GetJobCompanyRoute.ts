import { inject, injectable } from '@needle-di/core';
import type { GetJobCompany } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetJobCompanyRoute {
  public constructor(private readonly getJobCompany: GetJobCompany = inject(DI.Job.GetJobCompany)) {}

  public plugin() {
    return new Elysia().get(
      '/companies/:id',
      async ({ params }) => {
        const company = await this.getJobCompany.execute({ companyId: params.id });
        return { data: company };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
