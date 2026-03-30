import { inject, injectable } from '@needle-di/core';
import type { ListEducation } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ListEducationRoute {
  public constructor(private readonly listEducation: ListEducation = inject(DI.Resume.ListEducation)) {}

  public plugin() {
    return new Elysia().get(
      '/users/:userId/resume/education',
      async ({ params }) => {
        const entries = await this.listEducation.execute({ userId: params.userId });
        return { data: entries };
      },
      {
        params: t.Object({ userId: t.String({ format: 'uuid' }) })
      }
    );
  }
}
