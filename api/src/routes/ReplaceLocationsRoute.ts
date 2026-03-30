import { inject, injectable } from '@needle-di/core';
import type { ReplaceLocations } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ReplaceLocationsRoute {
  public constructor(private readonly replaceLocations: ReplaceLocations = inject(DI.Resume.ReplaceLocations)) {}

  public plugin() {
    return new Elysia().put(
      '/resume/companies/:id/locations',
      async ({ params, body, set }) => {
        const result = await this.replaceLocations.execute({
          companyId: params.id,
          locations: body.locations
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
          locations: t.Array(t.Object({ label: t.String({ minLength: 1 }), ordinal: t.Integer({ minimum: 0 }) }))
        })
      }
    );
  }
}
