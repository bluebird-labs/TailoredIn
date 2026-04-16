import { inject, injectable } from '@needle-di/core';
import type { ListApplications } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';
import type { AuthContext } from '../../middleware/auth.js';

@injectable()
export class ListApplicationsRoute {
  public constructor(private readonly listApplications: ListApplications = inject(DI.Application.List)) {}

  public plugin() {
    return new Elysia().get('/applications', async ctx => {
      const { auth } = ctx as unknown as AuthContext;
      const data = await this.listApplications.execute({ profileId: auth.profileId });
      return { data };
    });
  }
}
