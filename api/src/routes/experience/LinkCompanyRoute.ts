import { inject, injectable } from '@needle-di/core';
import type { LinkCompanyToExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class LinkCompanyRoute {
  public constructor(private readonly linkCompany: LinkCompanyToExperience = inject(DI.Experience.LinkCompany)) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:id/company',
      async ({ params, body, set }) => {
        const result = await this.linkCompany.execute({
          experienceId: params.id,
          companyId: body.company_id
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({ company_id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
