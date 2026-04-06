import { inject, injectable } from '@needle-di/core';
import type { CreateCompany } from '@tailoredin/application';
import type { BusinessType, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateCompanyRoute {
  public constructor(private readonly createCompany: CreateCompany = inject(DI.Company.Create)) {}

  public plugin() {
    return new Elysia().post(
      '/companies',
      async ({ body, set }) => {
        const data = await this.createCompany.execute({
          name: body.name,
          description: body.description ?? null,
          website: body.website ?? null,
          logoUrl: body.logo_url ?? null,
          linkedinLink: body.linkedin_link ?? null,
          businessType: (body.business_type as BusinessType) ?? null,
          industry: (body.industry as Industry) ?? null,
          stage: (body.stage as CompanyStage) ?? null,
          status: (body.status as CompanyStatus) ?? null
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          description: t.Optional(t.Nullable(t.String())),
          website: t.Optional(t.Nullable(t.String())),
          logo_url: t.Optional(t.Nullable(t.String())),
          linkedin_link: t.Optional(t.Nullable(t.String())),
          business_type: t.Optional(t.Nullable(t.String())),
          industry: t.Optional(t.Nullable(t.String())),
          stage: t.Optional(t.Nullable(t.String())),
          status: t.Optional(t.Nullable(t.String()))
        })
      }
    );
  }
}
