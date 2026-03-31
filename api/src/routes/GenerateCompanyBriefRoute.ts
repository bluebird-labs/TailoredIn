import { inject, injectable } from '@needle-di/core';
import type { GenerateCompanyBrief } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GenerateCompanyBriefRoute {
  public constructor(
    private readonly generateCompanyBrief: GenerateCompanyBrief = inject(DI.CompanyBrief.GenerateCompanyBrief)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/jobs/:id/generate-brief',
      async ({ params, set }) => {
        const result = await this.generateCompanyBrief.execute({ jobId: params.id });

        if (!result.isOk) {
          set.status = 400;
          return { error: { code: 'GENERATION_FAILED', message: result.error.message } };
        }

        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
