import { inject, injectable } from '@needle-di/core';
import type { DeleteCompany } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteCompanyRoute {
  public constructor(private readonly deleteCompany: DeleteCompany = inject(DI.Resume.DeleteCompany)) {}

  public plugin() {
    return new Elysia().delete(
      '/resume/companies/:id',
      async ({ params, set }) => {
        const result = await this.deleteCompany.execute({ companyId: params.id });
        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
