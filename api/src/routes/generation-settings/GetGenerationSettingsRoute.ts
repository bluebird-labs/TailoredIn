import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { GetGenerationSettings } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

@injectable()
export class GetGenerationSettingsRoute {
  public constructor(
    private readonly getGenerationSettings: GetGenerationSettings = inject(DI.GenerationSettings.Get),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia().get('/generation-settings', async () => {
      const profileId = await getProfileId(this.orm);
      const data = await this.getGenerationSettings.execute({ profileId });
      return { data };
    });
  }
}
