import { inject, injectable } from '@needle-di/core';
import type { GetCompanyBrief } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetCompanyBriefRoute {
  public constructor(private readonly getCompanyBrief: GetCompanyBrief = inject(DI.CompanyBrief.GetCompanyBrief)) {}

  public plugin() {
    return new Elysia().get(
      '/jobs/:id/brief',
      async ({ params, set }) => {
        const result = await this.getCompanyBrief.execute({ jobId: params.id });

        if (!result.isOk) {
          set.status = 400;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
