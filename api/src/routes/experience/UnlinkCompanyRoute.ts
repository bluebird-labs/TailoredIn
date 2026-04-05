import { inject, injectable } from '@needle-di/core';
import type { UnlinkCompanyFromExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UnlinkCompanyRoute {
  public constructor(
    private readonly unlinkCompany: UnlinkCompanyFromExperience = inject(DI.Experience.UnlinkCompany)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/experiences/:id/company',
      async ({ params, set }) => {
        const result = await this.unlinkCompany.execute({
          experienceId: params.id
        });
        if (!result.isOk) {
          set.status = 404;
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
