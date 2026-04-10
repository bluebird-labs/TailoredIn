import { inject, injectable } from '@needle-di/core';
import type { UpdateCompany } from '@tailoredin/application';
import { BusinessType, CompanyStage, CompanyStatus, Industry } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateCompanyRoute {
  public constructor(private readonly updateCompany: UpdateCompany = inject(DI.Company.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/companies/:id',
      async ({ params, body, set }) => {
        try {
          const data = await this.updateCompany.execute({
            companyId: params.id,
            name: body.name,
            domainName: body.domain_name,
            description: body.description ?? null,
            website: body.website ?? null,
            logoUrl: body.logo_url ?? null,
            businessType: (body.business_type as BusinessType) ?? BusinessType.UNKNOWN,
            industry: (body.industry as Industry) ?? Industry.UNKNOWN,
            stage: (body.stage as CompanyStage) ?? CompanyStage.UNKNOWN,
            status: (body.status as CompanyStatus) ?? CompanyStatus.UNKNOWN
          });
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
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          name: t.String({ minLength: 1 }),
          domain_name: t.String({ minLength: 1 }),
          description: t.Optional(t.Nullable(t.String())),
          website: t.Optional(t.Nullable(t.String())),
          logo_url: t.Optional(t.Nullable(t.String())),
          business_type: t.Optional(t.Nullable(t.String())),
          industry: t.Optional(t.Nullable(t.String())),
          stage: t.Optional(t.Nullable(t.String())),
          status: t.Optional(t.Nullable(t.String()))
        })
      }
    );
  }
}
