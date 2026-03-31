import { inject, injectable } from '@needle-di/core';
import type { UpdateCompany } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateCompanyRoute {
  public constructor(private readonly updateCompany: UpdateCompany = inject(DI.Resume.UpdateCompany)) {}

  public plugin() {
    return new Elysia().put(
      '/resume/companies/:id',
      async ({ params, body, set }) => {
        const result = await this.updateCompany.execute({
          companyId: params.id,
          companyName: body.company_name,
          companyMention: body.company_mention,
          websiteUrl: body.website_url,
          businessDomain: body.business_domain,
          jobTitle: body.job_title,
          joinedAt: body.joined_at,
          leftAt: body.left_at,
          promotedAt: body.promoted_at
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: result.error.message };
        }
        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          company_name: t.Optional(t.String({ minLength: 1 })),
          company_mention: t.Optional(t.Nullable(t.String())),
          website_url: t.Optional(t.Nullable(t.String())),
          business_domain: t.Optional(t.String({ minLength: 1 })),
          job_title: t.Optional(t.Nullable(t.String())),
          joined_at: t.Optional(t.String({ minLength: 1 })),
          left_at: t.Optional(t.String({ minLength: 1 })),
          promoted_at: t.Optional(t.Nullable(t.String()))
        })
      }
    );
  }
}
