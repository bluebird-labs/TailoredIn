import { inject, injectable } from '@needle-di/core';
import type { GetUser } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GetUserRoute {
  public constructor(private readonly getUser: GetUser = inject(DI.Resume.GetUser)) {}

  public plugin() {
    return new Elysia().get(
      '/users/:id',
      async ({ params }) => {
        const user = await this.getUser.execute({ userId: params.id });
        return { data: user };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
