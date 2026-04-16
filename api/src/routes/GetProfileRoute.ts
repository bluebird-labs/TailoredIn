import { inject, injectable } from '@needle-di/core';
import type { GetProfile } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';
import type { AuthContext } from '../middleware/auth.js';

@injectable()
export class GetProfileRoute {
  public constructor(private readonly getProfile: GetProfile = inject(DI.Profile.GetProfile)) {}

  public plugin() {
    return new Elysia().get('/profile', async ctx => {
      const { auth } = ctx as unknown as AuthContext;
      const profile = await this.getProfile.execute({ profileId: auth.profileId });
      return { data: profile };
    });
  }
}
