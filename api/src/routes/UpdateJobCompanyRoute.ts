import { inject, injectable } from '@needle-di/core';
import type { UpdateJobCompany } from '@tailoredin/application';
import { BusinessType, CompanyStage, Industry } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateJobCompanyRoute {
  public constructor(private readonly updateJobCompany: UpdateJobCompany = inject(DI.Job.UpdateJobCompany)) {}

  public plugin() {
    return new Elysia().put(
      '/companies/:id',
      async ({ params, body, set }) => {
        await this.updateJobCompany.execute({
          companyId: params.id,
          businessType: body.business_type,
          industry: body.industry,
          stage: body.stage
        });

        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          business_type: t.Optional(t.Nullable(t.Enum(BusinessType))),
          industry: t.Optional(t.Nullable(t.Enum(Industry))),
          stage: t.Optional(t.Nullable(t.Enum(CompanyStage)))
        })
      }
    );
  }
}
