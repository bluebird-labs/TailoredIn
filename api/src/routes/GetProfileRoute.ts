import { inject, injectable } from '@needle-di/core';
import type { GetProfile } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class GetProfileRoute {
  public constructor(private readonly getProfile: GetProfile = inject(DI.Profile.GetProfile)) {}

  public plugin() {
    return new Elysia().get('/profile', async () => {
      const profile = await this.getProfile.execute();
      return { data: profile };
    });
  }
}
